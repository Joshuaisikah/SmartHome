<?php

namespace App\Http\Controllers;

use App\Models\ParentalControlSettings;
use Illuminate\Http\Request;

class ParentalControlSettingsController extends Controller
{
    private $appDomains = [
        'YouTube' => [
            'youtube.com',
            'googlevideo.com',
            'ytimg.com',
            'youtu.be',
            'youtube-nocookie.com',
            'youtube.googleapis.com',
            'yt.be',
            'youtubekids.com',
            'youtubeeducation.com',
            'ggpht.com',
            'ytstatic.com',
            'youtubei.googleapis.com',
            'yt.googleapis.com',
        ],
        'TikTok' => [
            'tiktok.com',
            'tiktokcdn.com',
            'musical.ly',
            'bytecdn.com',
            'tiktokv.com',
            'ttlivecdn.com',
            'tiktokcdn-us.com',
        ],
    ];

    public function __construct()
    {
        // Load custom apps from the database on controller initialization
        $settings = ParentalControlSettings::first();
        if ($settings && $settings->custom_apps) {
            $customApps = json_decode($settings->custom_apps, true) ?? [];
            $this->appDomains = array_merge($this->appDomains, $customApps);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'app_restrictions' => 'nullable|json',
            'internet_restricted' => 'nullable|boolean',
            'custom_apps' => 'nullable|json', // Add custom_apps to store new apps/sites
        ]);

        $settings = ParentalControlSettings::updateOrCreate([], $request->all());
        return response()->json($settings, 201);
    }

    public function index()
    {
        $settings = ParentalControlSettings::first() ?? new ParentalControlSettings();
        return response()->json([
            'app_restrictions' => json_decode($settings->app_restrictions, true) ?? [],
            'internet_restricted' => $settings->internet_restricted ?? false,
            'custom_apps' => json_decode($settings->custom_apps, true) ?? [],
            'available_apps' => array_keys($this->appDomains), // Return all available apps
        ]);
    }

    public function addApp(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'domains' => 'required|array',
            'domains.*' => 'required|string', // Ensure each domain is a string
        ]);

        $name = $request->input('name');
        $domains = $request->input('domains');

        // Normalize the name (e.g., "WhatsApp" to "WhatsApp")
        $name = ucfirst(strtolower($name));

        // Validate domains (basic check for valid domain format)
        foreach ($domains as $domain) {
            if (!preg_match('/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/', $domain)) {
                return response()->json(['error' => "Invalid domain: $domain"], 400);
            }
        }

        $settings = ParentalControlSettings::firstOrCreate([]);
        $customApps = json_decode($settings->custom_apps, true) ?? [];

        // Add the new app/site to custom_apps
        $customApps[$name] = $domains;
        $settings->custom_apps = json_encode($customApps);
        $settings->save();

        // Update the in-memory appDomains
        $this->appDomains[$name] = $domains;

        \Log::info("Added new app/site to restrict: $name", ['domains' => $domains]);

        return response()->json(['success' => true, 'message' => "Added $name to restricted apps/sites"]);
    }

    public function restrictApp($app)
    {
        if (!array_key_exists($app, $this->appDomains)) {
            \Log::error("App not supported: $app");
            return response()->json(['error' => 'App not supported'], 400);
        }

        $settings = ParentalControlSettings::firstOrCreate([]);
        $appRestrictions = json_decode($settings->app_restrictions, true) ?? [];
        if (!in_array($app, $appRestrictions)) {
            $appRestrictions[] = $app;
            $settings->app_restrictions = json_encode($appRestrictions);
            $settings->save();
            \Log::info("Restricted app: $app");
        }

        // Update the Squid blocklist
        $this->updateSquidBlocklist();

        return response()->json(['success' => true]);
    }

    public function allowApp($app)
    {
        if (!array_key_exists($app, $this->appDomains)) {
            \Log::error("App not supported: $app");
            return response()->json(['error' => 'App not supported'], 400);
        }

        $settings = ParentalControlSettings::firstOrCreate([]);
        $appRestrictions = json_decode($settings->app_restrictions, true) ?? [];
        if (in_array($app, $appRestrictions)) {
            $appRestrictions = array_diff($appRestrictions, [$app]);
            $settings->app_restrictions = json_encode($appRestrictions);
            $settings->save();
            \Log::info("Allowed app: $app");
        }

        // Update the Squid blocklist
        $this->updateSquidBlocklist();

        return response()->json(['success' => true]);
    }

    public function restrictInternet()
    {
        $settings = ParentalControlSettings::firstOrCreate([]);
        $settings->internet_restricted = true;
        $settings->save();

        // Update the Squid configuration to block all traffic
        $this->updateSquidConfig(true);

        \Log::info("Internet access restricted via Squid proxy");

        return response()->json(['success' => true]);
    }

    public function allowInternet()
    {
        $settings = ParentalControlSettings::firstOrCreate([]);
        $settings->internet_restricted = false;
        $settings->save();

        // Update the Squid configuration to allow traffic
        $this->updateSquidConfig(false);

        \Log::info("Internet access allowed via Squid proxy");

        return response()->json(['success' => true]);
    }

    public function status()
    {
        $settings = ParentalControlSettings::firstOrCreate([]);
        return response()->json([
            'app_restrictions' => json_decode($settings->app_restrictions, true) ?? [],
            'internet_restricted' => $settings->internet_restricted ?? false,
            'custom_apps' => json_decode($settings->custom_apps, true) ?? [],
            'available_apps' => array_keys($this->appDomains),
        ]);
    }

    private function updateSquidBlocklist()
    {
        $settings = ParentalControlSettings::firstOrCreate([]);
        $appRestrictions = json_decode($settings->app_restrictions, true) ?? [];

        // Build the list of domains to block as regex patterns
        $blockedDomains = [];
        foreach ($appRestrictions as $app) {
            if (isset($this->appDomains[$app])) {
                foreach ($this->appDomains[$app] as $domain) {
                    // Escape dots and match domain and subdomains
                    $escapedDomain = str_replace('.', '\.', $domain);
                    $blockedDomains[] = $escapedDomain;
                    \Log::debug("Adding domain to blocklist: $escapedDomain");
                }
            }
        }

        // Write the blocklist to /etc/squid/blocked_domains.acl
        $blocklistContent = implode("\n", array_unique($blockedDomains));
        file_put_contents('/tmp/blocked_domains.acl', $blocklistContent);
        $result = shell_exec("sudo mv /tmp/blocked_domains.acl /etc/squid/blocked_domains.acl 2>&1");
        if (strpos($result, 'error') !== false) {
            \Log::error("Failed to update Squid blocklist: $result");
        } else {
            \Log::info("Updated Squid blocklist: " . $blocklistContent);
        }

        // Reload Squid to apply the changes
        $reloadResult = shell_exec("sudo systemctl reload squid 2>&1");
        if (strpos($reloadResult, 'error') !== false) {
            \Log::error("Failed to reload Squid: $reloadResult");
        } else {
            \Log::info("Squid reloaded successfully");
        }
    }

    private function updateSquidConfig($blockAll = false)
    {
        $settings = ParentalControlSettings::firstOrCreate([]);
        $appRestrictions = json_decode($settings->app_restrictions, true) ?? [];

        // Base Squid configuration
        $config = [
            "# Squid configuration file",
            "http_port 3128 transparent",
            "",
            "# Define the blocklist using url_regex",
            'acl blocked_domains url_regex -i "/etc/squid/blocked_domains.acl"',
            "",
        ];

        // Add block all rule if internet is restricted
        if ($blockAll) {
            $config[] = "# Block all traffic";
            $config[] = "acl block_all dstdomain .";
            $config[] = "http_access deny block_all";
            $config[] = "";
        } else {
            // If internet is not restricted, still block specific apps
            if (!empty($appRestrictions)) {
                $config[] = "# Deny access to blocked domains";
                $config[] = "http_access deny blocked_domains";
                $config[] = "";
            }
        }

        // Allow all other traffic
        $config[] = "# Allow all other traffic";
        $config[] = "http_access allow all";
        $config[] = "";
        $config[] = "# Define localnet (your local machine)";
        $config[] = "acl localnet src 127.0.0.1";
        $config[] = "acl localnet src ::1";
        $config[] = "";
        $config[] = "# Logging";
        $config[] = "access_log /var/log/squid/access.log squid issah:squid 640";

        // Write the new configuration to /etc/squid/squid.conf
        $configContent = implode("\n", $config);
        file_put_contents('/tmp/squid.conf', $configContent);
        $result = shell_exec("sudo mv /tmp/squid.conf /etc/squid/squid.conf 2>&1");
        if (strpos($result, 'error') !== false) {
            \Log::error("Failed to update Squid config: $result");
        } else {
            \Log::info("Updated Squid config: " . $configContent);
        }

        // Reload Squid to apply the changes
        $reloadResult = shell_exec("sudo systemctl reload squid 2>&1");
        if (strpos($reloadResult, 'error') !== false) {
            \Log::error("Failed to reload Squid: $reloadResult");
        } else {
            \Log::info("Squid reloaded successfully");
        }
    }
}