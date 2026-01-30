# PNGEC Device Agent - Technical Specification

## Overview

The PNGEC Device Agent is a Windows background service that enables the LPV Electoral System web application to communicate with biometric devices. Since web browsers cannot directly access USB devices for security reasons, this companion service acts as a bridge.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    LPV Web Application                           │
│                   (Browser-based UI)                             │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTPS (localhost:9876)
                       │ Token Authentication
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   PNGEC Device Agent                             │
│              (Windows Service / Tray App)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Device Abstraction Layer (DAL)               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │   │
│  │  │  Suprema    │  │ Crossmatch  │  │   HID       │       │   │
│  │  │  Adapter    │  │  Adapter    │  │  Adapter    │       │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬───────────────────────────────────────────┘
                       │ Vendor SDK / Driver
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Biometric Device                               │
│              (USB / Ethernet / Wireless)                         │
└──────────────────────────────────────────────────────────────────┘
```

## Implementation Options

### Option 1: .NET 8 Worker Service (Recommended)

```csharp
// Program.cs
using PngecDeviceAgent;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddHostedService<DeviceAgentService>();
builder.Services.AddSingleton<IDeviceDiscovery, DeviceDiscoveryService>();
builder.Services.AddSingleton<ICaptureService, CaptureService>();
builder.Services.AddSingleton<IDiagnosticsService, DiagnosticsService>();

// Add vendor-specific adapters
builder.Services.AddSingleton<IVendorAdapter, SupremaAdapter>();
builder.Services.AddSingleton<IVendorAdapter, CrossmatchAdapter>();

// Add local API server
builder.Services.AddSingleton<LocalApiServer>();

var host = builder.Build();
host.Run();
```

### Option 2: Electron Tray App

For easier distribution and auto-updates, an Electron app with native Node.js bindings can be used.

### Option 3: Node.js Service with Native Bindings

If vendor SDKs provide Node.js bindings or C/C++ libraries that can be wrapped.

## Local API Specification

### Base URL
```
https://localhost:9876
```

### Authentication
All requests must include a Bearer token issued by the LPV system:
```
Authorization: Bearer <short-lived-token>
```

### Endpoints

#### GET /agent/version
Returns agent version and SDK information.

**Response:**
```json
{
  "agent_version": "1.0.0",
  "sdk_version": "2.1.4",
  "driver_version": "1.8.0",
  "vendor": "Suprema",
  "machine_id": "PNGEC-WS-001",
  "uptime_seconds": 86400
}
```

#### GET /devices
Lists all connected devices.

**Response:**
```json
{
  "devices": [
    {
      "device_uid": "uuid",
      "vendor_serial_number": "FP-2024-001234",
      "vendor_name": "Suprema",
      "model": "BioMini Plus 2",
      "device_type": "fingerprint",
      "connectivity": "usb",
      "status": "ready",
      "firmware_version": "2.1.4"
    }
  ]
}
```

#### GET /devices/{device_uid}
Get detailed information about a specific device.

**Response:**
```json
{
  "device_uid": "uuid",
  "vendor_serial_number": "FP-2024-001234",
  "vendor_name": "Suprema",
  "model": "BioMini Plus 2",
  "device_type": "fingerprint",
  "firmware_version": "2.1.4",
  "driver_status": "loaded",
  "sdk_initialized": true,
  "capabilities": {
    "fingerprint_capture": true,
    "template_extraction": true,
    "image_capture": true,
    "liveness_detection": true
  },
  "sensor_info": {
    "resolution_dpi": 500,
    "sensor_size_mm": "16x18",
    "image_quality_threshold": 40
  }
}
```

#### POST /devices/{device_uid}/open-session
Opens a capture session with the device.

**Response:**
```json
{
  "session_id": "uuid",
  "expires_at": "2024-01-15T11:00:00Z"
}
```

#### POST /devices/{device_uid}/close-session
Closes an active capture session.

**Response:**
```json
{
  "success": true
}
```

#### POST /capture/fingerprint
Captures a fingerprint.

**Request:**
```json
{
  "device_uid": "uuid",
  "finger": "right_index",
  "timeout_ms": 30000,
  "quality_threshold": 40,
  "return_image": true,
  "return_template": true
}
```

**Response:**
```json
{
  "success": true,
  "capture_id": "uuid",
  "finger": "right_index",
  "quality_score": 92,
  "template": "base64-encoded-template",
  "template_format": "ISO_19794_2",
  "template_size_bytes": 512,
  "image_base64": "base64-encoded-image",
  "image_format": "PNG",
  "image_width": 256,
  "image_height": 360,
  "capture_time_ms": 1250,
  "liveness_score": 98
}
```

**Error Response:**
```json
{
  "success": false,
  "error_code": "CAPTURE_TIMEOUT",
  "error_message": "No finger detected within timeout period",
  "details": {
    "timeout_ms": 30000,
    "attempts": 3
  }
}
```

#### POST /capture/face
Captures a face image.

**Request:**
```json
{
  "device_uid": "uuid",
  "timeout_ms": 30000,
  "quality_threshold": 60,
  "return_template": true
}
```

**Response:**
```json
{
  "success": true,
  "capture_id": "uuid",
  "quality_score": 85,
  "template": "base64-encoded-template",
  "image_base64": "base64-encoded-image",
  "face_detected": true,
  "face_count": 1,
  "capture_time_ms": 850
}
```

#### POST /devices/{device_uid}/diagnostics
Runs device diagnostics.

**Response:**
```json
{
  "device_uid": "uuid",
  "timestamp": "2024-01-15T10:30:00Z",
  "health_status": "OK",
  "overall_score": 95,
  "metrics": {
    "sensor_quality": 98,
    "temperature_c": 35.5,
    "capture_success_rate": 99.2,
    "avg_capture_time_ms": 1100,
    "memory_usage_mb": 128,
    "uptime_seconds": 86400
  },
  "warnings": [],
  "errors": [],
  "firmware_update_available": false
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `DEVICE_NOT_FOUND` | Device with specified UID not connected |
| `DRIVER_MISSING` | Device driver not installed |
| `SDK_NOT_INITIALIZED` | Vendor SDK failed to initialize |
| `SESSION_REQUIRED` | Must open session before capture |
| `SESSION_EXPIRED` | Capture session has expired |
| `CAPTURE_TIMEOUT` | No biometric detected within timeout |
| `LOW_QUALITY_SAMPLE` | Captured sample below quality threshold |
| `DEVICE_BUSY` | Device in use by another process |
| `PERMISSION_DENIED` | Insufficient permissions |
| `HARDWARE_ERROR` | Device hardware malfunction |
| `TAMPER_DETECTED` | Device tamper detection triggered |

## Device Abstraction Layer (DAL)

### Interfaces

```csharp
// IDeviceDiscovery.cs
public interface IDeviceDiscovery
{
    Task<IEnumerable<DeviceInfo>> EnumerateDevicesAsync();
    Task<DeviceInfo?> GetDeviceAsync(string deviceUid);
    event EventHandler<DeviceConnectedEventArgs> DeviceConnected;
    event EventHandler<DeviceDisconnectedEventArgs> DeviceDisconnected;
}

// ICaptureService.cs
public interface ICaptureService
{
    Task<CaptureResult> CaptureFingerprintAsync(CaptureRequest request);
    Task<CaptureResult> CaptureFaceAsync(CaptureRequest request);
    Task<CaptureResult> CaptureIrisAsync(CaptureRequest request);
}

// IDiagnosticsService.cs
public interface IDiagnosticsService
{
    Task<DiagnosticsResult> RunDiagnosticsAsync(string deviceUid);
    Task<HealthStatus> GetHealthStatusAsync(string deviceUid);
}

// IVendorAdapter.cs
public interface IVendorAdapter
{
    string VendorName { get; }
    bool CanHandle(string vendorId, string productId);
    Task InitializeAsync(string devicePath);
    Task<string> GetSerialNumberAsync();
    Task<CaptureResult> CaptureAsync(CaptureType type, CaptureOptions options);
    Task<DiagnosticsResult> DiagnoseAsync();
}
```

### Vendor Adapters

Each vendor SDK requires a specific adapter:

```csharp
// SupremaAdapter.cs
public class SupremaAdapter : IVendorAdapter
{
    private readonly SupremaSDK _sdk;

    public string VendorName => "Suprema";

    public bool CanHandle(string vid, string pid)
    {
        // Suprema vendor ID and known product IDs
        return vid == "16D1" && new[] { "0401", "0402", "0501" }.Contains(pid);
    }

    public async Task<CaptureResult> CaptureAsync(CaptureType type, CaptureOptions options)
    {
        // Call Suprema SDK methods
        var result = await _sdk.CaptureAsync(options.Timeout);
        return new CaptureResult
        {
            Success = result.Quality >= options.QualityThreshold,
            Template = result.Template,
            QualityScore = result.Quality
        };
    }
}
```

## Security Requirements

### 1. Local API Security

- **mTLS**: Use mutual TLS with self-signed certificates
- **Token Authentication**: Short-lived tokens (5-minute expiry)
- **CORS**: Restrict to LPV system origin only
- **Rate Limiting**: Prevent abuse

### 2. Audit Logging

All operations must be logged:
```csharp
public class AuditLogger
{
    public void Log(AuditEvent evt)
    {
        // Log to encrypted local file
        // Include: timestamp, action, device_uid, user, result
    }
}
```

### 3. Secure Storage

- SDK license keys: Windows Credential Manager
- Configuration: Encrypted config file
- Audit logs: Encrypted at rest

## Installation Package

### Contents

```
PNGEC-Device-Agent-Setup.msi
├── drivers/
│   ├── suprema-driver.inf
│   ├── crossmatch-driver.inf
│   └── hid-driver.inf
├── sdk/
│   ├── SupremaSDK.dll
│   ├── CrossmatchSDK.dll
│   └── dependencies/
├── agent/
│   ├── PngecDeviceAgent.exe
│   └── config/
└── certificates/
    └── localhost.pfx
```

### Installation Steps

1. Check system requirements (Windows 11, .NET 8 Runtime)
2. Install vendor drivers (silent install)
3. Install SDK dependencies
4. Install agent service
5. Generate/install localhost certificate
6. Start service
7. Verify installation

### Configuration File

```json
{
  "api": {
    "port": 9876,
    "allowed_origins": ["https://brs.pngec.gov.pg"],
    "token_secret_key_ref": "windows_credential_manager"
  },
  "environment": "PROD",
  "logging": {
    "level": "INFO",
    "file_path": "C:\\ProgramData\\PNGEC\\DeviceAgent\\logs",
    "encrypt": true,
    "max_size_mb": 100,
    "retention_days": 90
  },
  "vendors": {
    "suprema": {
      "sdk_path": "C:\\Program Files\\PNGEC\\DeviceAgent\\sdk\\SupremaSDK.dll",
      "license_key_ref": "windows_credential_manager"
    }
  },
  "health_check": {
    "interval_seconds": 60,
    "report_to_server": true
  }
}
```

## Offline Operation

The agent must support offline operation:

1. **Local Cache**: Store pending sync data locally
2. **Queue Operations**: Queue audit events for later sync
3. **Conflict Resolution**: Handle sync conflicts when back online
4. **Health Monitoring**: Continue local health logging

## Integration with LPV System

### Frontend Integration

```typescript
// device-agent-client.ts
export class DeviceAgentClient {
  private baseUrl = 'https://localhost:9876';

  async getDevices(): Promise<Device[]> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/devices`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  async captureFingerprint(options: CaptureOptions): Promise<CaptureResult> {
    // Implementation in device-service.ts
  }
}
```

### Connection Status

The web app should show agent connection status:
- Green: Agent connected and healthy
- Yellow: Agent connected but device issues
- Red: Agent not reachable

## Development Setup

### Prerequisites

1. Windows 11 Pro/Enterprise
2. Visual Studio 2022 with .NET 8 SDK
3. Vendor SDK developer licenses
4. Test biometric devices

### Building

```bash
cd PngecDeviceAgent
dotnet restore
dotnet build --configuration Release
dotnet publish -c Release -o ./publish
```

### Testing

```bash
# Run unit tests
dotnet test

# Run integration tests (requires device)
dotnet test --filter Category=Integration
```

## Deployment Checklist

- [ ] Driver packages signed and tested
- [ ] SDK licenses obtained for production
- [ ] Installer tested on clean Windows 11 install
- [ ] Auto-update mechanism configured
- [ ] Logging and monitoring configured
- [ ] Security audit completed
- [ ] Documentation for field technicians
- [ ] Rollback procedure documented

## Support & Troubleshooting

### Common Issues

1. **Device not detected**: Check driver installation, USB connection
2. **SDK initialization failed**: Verify license key, SDK version
3. **API connection refused**: Check firewall, certificate
4. **Low quality captures**: Clean sensor, adjust lighting
5. **Tamper detection**: Device may need physical inspection

### Log Locations

- Agent logs: `C:\ProgramData\PNGEC\DeviceAgent\logs\`
- Windows Event Log: Application > PNGEC Device Agent
- Crash dumps: `C:\ProgramData\PNGEC\DeviceAgent\crashes\`

---

*This specification is for the PNGEC Biometric Registration System (BRS) Device Agent component. The web application integration is handled by the LPV system frontend.*
