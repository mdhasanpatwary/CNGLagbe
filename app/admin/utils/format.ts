import { type TextKey } from "@/constants/text";

export const formatDate = (date: string | Date | undefined, t: (key: TextKey) => string, includeDate = false) => {
   if (!date) return t("just_now");
   const d = new Date(date);
   if (isNaN(d.getTime())) return t("just_now");

   const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   if (!includeDate) return timeStr;

   return `${d.toLocaleDateString()} ${timeStr}`;
};
