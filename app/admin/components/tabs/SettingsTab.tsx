import { useState } from "react";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { TextKey } from "@/constants/text";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
}

interface SettingsTabProps {
  settings: SystemSetting[];
  handleUpdateSetting: (key: string, value: string) => Promise<void>;
  t: (key: TextKey) => string | undefined;
}

export function SettingsTab({
  settings,
  handleUpdateSetting,
  t,
}: SettingsTabProps) {
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  // Initialize local state from props
  const getSettingValue = (key: string, defaultValue: string = "") => {
    if (localSettings[key] !== undefined) return localSettings[key];
    const setting = settings.find((s) => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  const handleValueChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    const value = getSettingValue(key);
    setIsSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await handleUpdateSetting(key, value);
    } finally {
      setIsSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t("settings" as TextKey) || "System Settings"}
            </h3>
            <p className="text-sm text-slate-500">
              {t("manage_platform_configurations" as TextKey) ||
                "Manage platform configurations and thresholds"}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Driver Request Minimum Balance */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <h4 className="font-semibold text-slate-900">
                {t("min_balance_title" as TextKey) || "Minimum Wallet Balance for Ride Requests"}
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                {t("min_balance_desc" as TextKey) || "Drivers with a balance equal to or lower than this will not receive new ride requests."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                  ৳
                </span>
                <input
                  type="number"
                  value={getSettingValue("MIN_WALLET_BALANCE_FOR_RIDE_REQUESTS", "-100")}
                  onChange={(e) =>
                    handleValueChange(
                      "MIN_WALLET_BALANCE_FOR_RIDE_REQUESTS",
                      e.target.value
                    )
                  }
                  className="w-32 pl-8 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                />
              </div>
              <AppButton
                onClick={() => handleSave("MIN_WALLET_BALANCE_FOR_RIDE_REQUESTS")}
                loading={isSaving["MIN_WALLET_BALANCE_FOR_RIDE_REQUESTS"]}
                leftIcon={<Save className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                {t("save_changes" as TextKey) || "Save"}
              </AppButton>
            </div>
          </div>

          {/* Booking Platform Fee Percentage */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <h4 className="font-semibold text-slate-900">
                {t("platform_fee_title" as TextKey) || "Platform Fee Percentage"}
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                {t("platform_fee_desc" as TextKey) || "Configure the booking platform fee percentage deducted from driver rides."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={getSettingValue("PLATFORM_FEE_PERCENTAGE", "5")}
                  onChange={(e) =>
                    handleValueChange(
                      "PLATFORM_FEE_PERCENTAGE",
                      e.target.value
                    )
                  }
                  className="w-32 pl-4 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                  %
                </span>
              </div>
              <AppButton
                onClick={() => handleSave("PLATFORM_FEE_PERCENTAGE")}
                loading={isSaving["PLATFORM_FEE_PERCENTAGE"]}
                leftIcon={<Save className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                {t("save_changes" as TextKey) || "Save"}
              </AppButton>
            </div>
          </div>

          {/* Per Kilometer CNG Rate */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <h4 className="font-semibold text-slate-900">
                {t("per_km_rate_title" as TextKey) || "Per Kilometer CNG Rate (BDT)"}
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                {t("per_km_rate_desc" as TextKey) || "Configure the base fare rate per kilometer used to calculate the passenger's CNG fare."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                  ৳
                </span>
                <input
                  type="number"
                  min="1"
                  value={getSettingValue("CNG_PER_KM_RATE", "20")}
                  onChange={(e) =>
                    handleValueChange(
                      "CNG_PER_KM_RATE",
                      e.target.value
                    )
                  }
                  className="w-32 pl-8 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                />
              </div>
              <AppButton
                onClick={() => handleSave("CNG_PER_KM_RATE")}
                loading={isSaving["CNG_PER_KM_RATE"]}
                leftIcon={<Save className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                {t("save_changes" as TextKey) || "Save"}
              </AppButton>
            </div>
          </div>

          {/* Driver Search Radius */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <h4 className="font-semibold text-slate-900">
                {t("driver_search_radius_title" as TextKey) || "Driver Search Radius (km)"}
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                {t("driver_search_radius_desc" as TextKey) || "Configure the search radius in kilometers for matching drivers with passenger ride requests."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={getSettingValue("DRIVER_SEARCH_RADIUS_KM", "3")}
                  onChange={(e) =>
                    handleValueChange(
                      "DRIVER_SEARCH_RADIUS_KM",
                      e.target.value
                    )
                  }
                  className="w-32 pl-4 pr-12 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-xs">
                  km
                </span>
              </div>
              <AppButton
                onClick={() => handleSave("DRIVER_SEARCH_RADIUS_KM")}
                loading={isSaving["DRIVER_SEARCH_RADIUS_KM"]}
                leftIcon={<Save className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                {t("save_changes" as TextKey) || "Save"}
              </AppButton>
            </div>
          </div>

          {/* Booking Request Timeout */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <h4 className="font-semibold text-slate-900">
                {t("booking_timeout_title" as TextKey) || "Booking Request Timeout (minutes)"}
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                {t("booking_timeout_desc" as TextKey) || "Configure how long the system searches for a driver before timing out the passenger's request."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="30"
                  step="1"
                  value={getSettingValue("BOOKING_REQUEST_TIMEOUT_MINUTES", "5")}
                  onChange={(e) =>
                    handleValueChange(
                      "BOOKING_REQUEST_TIMEOUT_MINUTES",
                      e.target.value
                    )
                  }
                  className="w-32 pl-4 pr-16 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-xs">
                  mins
                </span>
              </div>
              <AppButton
                onClick={() => handleSave("BOOKING_REQUEST_TIMEOUT_MINUTES")}
                loading={isSaving["BOOKING_REQUEST_TIMEOUT_MINUTES"]}
                leftIcon={<Save className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                {t("save_changes" as TextKey) || "Save"}
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
