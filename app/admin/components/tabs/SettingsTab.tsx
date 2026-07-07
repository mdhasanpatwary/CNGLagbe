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
          {/* Auto Approve Contributed Drivers */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <h4 className="font-semibold text-slate-900">
                {t("auto_approve_setting_title" as TextKey) || "Auto Approve Contributed Drivers"}
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                {t("auto_approve_setting_desc" as TextKey) || "If enabled, newly added drivers by users will be visible immediately."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={getSettingValue("AUTO_APPROVE_CONTRIBUTED_DRIVERS", "true")}
                onChange={(e) =>
                  handleValueChange(
                    "AUTO_APPROVE_CONTRIBUTED_DRIVERS",
                    e.target.value
                  )
                }
                className="w-32 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 bg-white"
              >
                <option value="true">Enable (Auto)</option>
                <option value="false">Disable (Pending)</option>
              </select>
              <AppButton
                onClick={() => handleSave("AUTO_APPROVE_CONTRIBUTED_DRIVERS")}
                loading={isSaving["AUTO_APPROVE_CONTRIBUTED_DRIVERS"]}
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
