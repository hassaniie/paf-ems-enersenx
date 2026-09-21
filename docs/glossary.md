# Glossary

Domain terms used across Enersenx EMS. Kept short and practical.

| Term | Meaning |
|------|---------|
| **Enersenx** | The product/platform. Multi-tenant energy monitoring system. |
| **Tenant** | A customer organisation using Enersenx (e.g. PAF). Data is isolated per tenant. |
| **PAF** | Pakistan Air Force — the running example tenant. |
| **Org node** | A node in a tenant's hierarchy (site / zone / building / feeder). Meters attach to nodes. |
| **Grid boundary** | The node/meter that is the utility connection point. Only here does "grid import/export" apply. |
| **Meter** | A metering point. Physical or *derived*. Carries class, transport, role. |
| **Main meter** | A node's incomer meter (its total). Contrast *sub-meter*. |
| **Derived / virtual meter** | A computed meter, e.g. `NASTP (Net) = NASTP Ph-III − CAC/CASS`. Display/analytics only. |
| **HT / LT** | High-Tension (~11 kV) / Low-Tension (230/400 V). A meter's class. |
| **Transport** | How readings arrive: Modbus, WiFi, or LoRaWAN. |
| **Modbus** | Wired industrial protocol; here, Modbus gateways poll meters into the backend. |
| **LoRaWAN** | Long-range low-power wireless; used for the PAF Hospital LT meters and Qureshi Camp. |
| **Import** | Power/energy flowing **into** a metered subtree. Positive sign. |
| **Export** | Power/energy flowing **back out** of a subtree. Negative sign. |
| **Internal reverse flow** | A sub-meter exporting *up to its parent* inside the site (e.g. CAC/CASS solar → NASTP). Not a grid export. |
| **Grid export** | The site boundary meter exporting to the utility (LESCO). Billable via net metering. |
| **Net** | `import − export`, always computed and labelled. Shown operationally; never used in billing views. |
| **Net metering** | Utility arrangement where exported energy earns credit against imported energy. |
| **PF (Power Factor)** | Ratio of real to apparent power (0–1). Low PF wastes capacity and incurs LESCO penalties. |
| **kVAR** | Reactive power. High kVAR / low PF → needs capacitor-bank compensation. |
| **Capacitor bank** | Equipment that corrects low power factor. |
| **LESCO** | Lahore Electric Supply Company — the utility. Source of PF penalties and demand charges. |
| **MDI (Maximum Demand Indicator)** | Peak demand over a period; drives demand charges. |
| **Sanctioned load** | The contracted maximum demand; exceeding it risks penalty. |
| **CT (Current Transformer)** | Sensor that measures current. A **CT fault** = voltage present but ~zero current → meter reads wrong; needs inspection. |
| **Tariff** | Price per kWh (PKR 56/kWh for PAF). |
| **PKT** | Pakistan Standard Time (UTC+5) — the display timezone. |
| **Voltage unbalance** | % difference between phase voltages; a power-quality metric. |
| **Meter state** | `online` / `stale` / `offline` / `faulty` / `awaiting-data` — derived from readings (domain-model §7). |
| **Awaiting-data** | Configured in the system but never reported yet (meter feed not connected). Distinct from *offline*. |
| **Offline** | Was reporting, now silent past the threshold (comms lost). |
| **Faulty** | Reporting, but readings implausible (e.g. CT fault). |
| **Alarm severity** | `critical` / `warning` / `info`. |
| **Auto-clear vs manual-clear** | Whether an alarm clears itself when the condition ends, or needs an engineer to acknowledge/clear. |
| **White-label** | Per-tenant branding (logo, accent). Never overrides safety-critical status colors. |
| **Snapshot** | A coherent picture of a tenant's topology + live state at a moment (`asOf`). The core payload the UI consumes. |
