import { consola } from 'consola';
import { ALERT_CRON, checkAlerts } from '../utils/alerts';

interface AlertEnv {
  NUXT_CLOUDFLARE_ANALYTICS_TOKEN?: string;
  NUXT_TELEGRAM_BOT_TOKEN?: string;
  NUXT_TELEGRAM_CHAT_ID?: string;
}

// The Cron Trigger in nuxt.config.ts (`triggers.crons`) runs this every 10
// minutes on Cloudflare. Without the three secrets it does nothing.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async ({ controller, env }) => {
    if (controller.cron !== ALERT_CRON) return;
    const secrets = env as AlertEnv;
    try {
      const sent = await checkAlerts({
        analyticsToken: secrets.NUXT_CLOUDFLARE_ANALYTICS_TOKEN,
        telegramBotToken: secrets.NUXT_TELEGRAM_BOT_TOKEN,
        telegramChatId: secrets.NUXT_TELEGRAM_CHAT_ID,
      }, controller.scheduledTime);
      if (sent) consola.info('Alert sent');
    } catch (error) {
      consola.error('Alert check failed:', (error as Error).message);
    }
  });
});
