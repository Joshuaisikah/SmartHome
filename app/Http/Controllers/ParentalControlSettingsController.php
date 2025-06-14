<?php

namespace App\Http\Controllers;

use App\Models\ParentalControlSettings;
use Illuminate\Http\Request;

class WindowsParentalControlController extends Controller
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

    private $hostsFilePath;
    private $proxyConfigPath;

    public function __construct()
    {
        // Windows paths
        $this->hostsFilePath = 'C:\Windows\System32\drivers\etc\hosts';
        $this->proxyConfigPath = storage_path('app/proxy_config.json');
        
        // Load custom apps from the database
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
            'custom_apps' => 'nullable|json',
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
            'available_apps' => array_keys($this->appDomains),
        ]);
    }

    public function addApp(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'domains' => 'required|array',
            'domains.*' => 'required|string',
        ]);

        $name = $request->input('name');
        $domains = $request->input('domains');
        $name = ucfirst(strtolower($name));

        // Validate domains
        foreach ($domains as $domain) {
            if (!preg_match('/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/', $domain)) {
                return response()->json(['error' => "Invalid domain: $domain"], 400);
            }
        }

        $settings = ParentalControlSettings::firstOrCreate([]);
        $customApps = json_decode($settings->custom_apps, true) ?? [];
        $customApps[$name] = $domains;
        $settings->custom_apps = json_encode($customApps);
        $settings->save();

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

        // Update Windows blocking mechanism
        $this->updateWindowsBlocking();

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

        $this->updateWindowsBlocking();
        return response()->json(['success' => true]);
    }

    public function restrictInternet()
    {
        $settings = ParentalControlSettings::firstOrCreate([]);
        $settings->internet_restricted = true;
        $settings->save();

        // Disable network adapter or set restrictive firewall rules
        $this->blockAllInternet();
        \Log::info("Internet access restricted");

        return response()->json(['success' => true]);
    }

    public function allowInternet()
    {
        $settings = ParentalControlSettings::firstOrCreate([]);
        $settings->internet_restricted = false;
        $settings->save();

        $this->unblockAllInternet();
        \Log::info("Internet access allowed");

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

    /**
     * Method 1: Use Windows hosts file to block domains
     */
    private function updateHostsFile()
    {
        try {
            $settings = ParentalControlSettings::firstOrCreate([]);
            $appRestrictions = json_decode($settings->app_restrictions, true) ?? [];

            // Read current hosts file
            $hostsContent = file_get_contents($this->hostsFilePath);
            
            // Remove existing parental control entries
            $hostsLines = explode("\n", $hostsContent);
            $cleanedLines = array_filter($hostsLines, function($line) {
                return strpos($line, '# ParentalControl') === false;
            });

            // Add blocked domains
            $blockedDomains = [];
            foreach ($appRestrictions as $app) {
                if (isset($this->appDomains[$app])) {
                    foreach ($this->appDomains[$app] as $domain) {
                        $blockedDomains[] = "127.0.0.1 $domain # ParentalControl";
                        $blockedDomains[] = "127.0.0.1 www.$domain # ParentalControl";
                    }
                }
            }

            // Combine content
            $newHostsContent = implode("\n", $cleanedLines);
            if (!empty($blockedDomains)) {
                $newHostsContent .= "\n\n# Parental Control Blocked Domains\n";
                $newHostsContent .= implode("\n", $blockedDomains);
            }

            // Write to temporary file first
            $tempFile = sys_get_temp_dir() . '/hosts_temp';
            file_put_contents($tempFile, $newHostsContent);

            // Copy to hosts file (requires admin privileges)
            $result = shell_exec("copy \"$tempFile\" \"$this->hostsFilePath\" 2>&1");
            
            // Flush DNS cache
            shell_exec("ipconfig /flushdns 2>&1");

            \Log::info("Updated Windows hosts file for domain blocking");
            
        } catch (\Exception $e) {
            \Log::error("Failed to update hosts file: " . $e->getMessage());
        }
    }

    /**
     * Method 2: Use Windows Firewall to block domains/IPs
     */
    private function updateWindowsFirewall()
    {
        try {
            $settings = ParentalControlSettings::firstOrCreate([]);
            $appRestrictions = json_decode($settings->app_restrictions, true) ?? [];

            // Remove existing parental control firewall rules
            shell_exec('netsh advfirewall firewall delete rule name="ParentalControl_Block" 2>&1');

            // Add new blocking rules for each restricted app
            foreach ($appRestrictions as $app) {
                if (isset($this->appDomains[$app])) {
                    foreach ($this->appDomains[$app] as $domain) {
                        // Block outbound connections to domain
                        $cmd = "netsh advfirewall firewall add rule name=\"ParentalControl_Block_$domain\" " .
                               "dir=out action=block remoteip=any " .
                               "description=\"Block access to $domain\" 2>&1";
                        shell_exec($cmd);
                    }
                }
            }

            \Log::info("Updated Windows Firewall rules for domain blocking");
            
        } catch (\Exception $e) {
            \Log::error("Failed to update firewall rules: " . $e->getMessage());
        }
    }

    /**
     * Method 3: Use PowerShell to set proxy settings
     */
    private function updateProxySettings()
    {
        try {
            $settings = ParentalControlSettings::firstOrCreate([]);
            $appRestrictions = json_decode($settings->app_restrictions, true) ?? [];

            if (!empty($appRestrictions)) {
                // Create a PAC file for proxy auto-config
                $pacContent = $this->generatePacFile($appRestrictions);
                $pacFile = storage_path('app/proxy.pac');
                file_put_contents($pacFile, $pacContent);

                // Set proxy settings via PowerShell
                $powershellCmd = 'powershell -Command "' .
                    'Set-ItemProperty -Path \"HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings\" -Name ProxyEnable -Value 1; ' .
                    'Set-ItemProperty -Path \"HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings\" -Name AutoConfigURL -Value \"file:///' . str_replace('\\', '/', $pacFile) . '\"' .
                    '"';
                
                shell_exec($powershellCmd);
            } else {
                // Disable proxy
                $powershellCmd = 'powershell -Command "' .
                    'Set-ItemProperty -Path \"HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings\" -Name ProxyEnable -Value 0' .
                    '"';
                shell_exec($powershellCmd);
            }

            \Log::info("Updated proxy settings for domain blocking");
            
        } catch (\Exception $e) {
            \Log::error("Failed to update proxy settings: " . $e->getMessage());
        }
    }

    private function generatePacFile($appRestrictions)
    {
        $blockedDomains = [];
        foreach ($appRestrictions as $app) {
            if (isset($this->appDomains[$app])) {
                foreach ($this->appDomains[$app] as $domain) {
                    $blockedDomains[] = $domain;
                }
            }
        }

        $domainsJs = json_encode($blockedDomains);
        
        return "
function FindProxyForURL(url, host) {
    var blockedDomains = $domainsJs;
    
    for (var i = 0; i < blockedDomains.length; i++) {
        if (shExpMatch(host, '*' + blockedDomains[i] + '*')) {
            return 'PROXY 127.0.0.1:9999'; // Block by routing to non-existent proxy
        }
    }
    
    return 'DIRECT';
}";
    }

    private function updateWindowsBlocking()
    {
        // Use multiple methods for better coverage
        $this->updateHostsFile();
        $this->updateWindowsFirewall();
        $this->updateProxySettings();
    }

    private function blockAllInternet()
    {
        try {
            // Method 1: Disable network adapters
            shell_exec('powershell -Command "Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | Disable-NetAdapter -Confirm:$false" 2>&1');
            
            // Method 2: Block all outbound traffic via firewall
            shell_exec('netsh advfirewall firewall add rule name="ParentalControl_BlockAll" dir=out action=block remoteip=any 2>&1');
            
            \Log::info("Blocked all internet access");
            
        } catch (\Exception $e) {
            \Log::error("Failed to block internet: " . $e->getMessage());
        }
    }

    private function unblockAllInternet()
    {
        try {
            // Method 1: Enable network adapters
            shell_exec('powershell -Command "Get-NetAdapter | Where-Object {$_.Status -eq \"Disabled\"} | Enable-NetAdapter -Confirm:$false" 2>&1');
            
            // Method 2: Remove blocking firewall rule
            shell_exec('netsh advfirewall firewall delete rule name="ParentalControl_BlockAll" 2>&1');
            
            \Log::info("Unblocked all internet access");
            
        } catch (\Exception $e) {
            \Log::error("Failed to unblock internet: " . $e->getMessage());
        }
    }
}