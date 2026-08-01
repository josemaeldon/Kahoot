import { query } from "./db";
import { PLAY_TIME_OPTIONS, type PlayTime } from "./playSettingsOptions";

export { PLAY_TIME_OPTIONS };

export async function getDefaultPlayTime() {
  const result = await query<{ default_play_time_seconds: number }>(
    `select default_play_time_seconds from system_settings where id = 1`
  );
  return Number(result.rows[0]?.default_play_time_seconds || 15);
}

export async function updateDefaultPlayTime(time: number, userId: string) {
  if (!PLAY_TIME_OPTIONS.includes(time as PlayTime)) {
    throw new Error("PLAY_TIME_INVALID");
  }
  const result = await query<{ default_play_time_seconds: number }>(
    `update system_settings
     set default_play_time_seconds = $1,
         updated_by = $2::uuid,
         updated_at = now()
     where id = 1
     returning default_play_time_seconds`,
    [time, userId]
  );
  return Number(result.rows[0].default_play_time_seconds);
}
