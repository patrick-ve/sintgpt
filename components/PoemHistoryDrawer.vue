<script setup lang="ts">
import type { PoemHistoryEntry } from '~/composables/usePoemHistory';

const open = defineModel<boolean>('open', { default: false });
const props = defineProps<{ activeId?: string | null }>();
const emit = defineEmits<{ select: [entry: PoemHistoryEntry] }>();

const { t, locale } = useI18n();
const { entries, remove, clear } = usePoemHistory();

const confirmingClear = ref(false);
watch(open, (isOpen) => {
  if (!isOpen) confirmingClear.value = false;
});

const dateFormat = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'nl' ? 'nl-NL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }),
);

const styleKeys: Record<string, string> = {
  'funny': 'form.style.funny',
  'classic': 'form.style.classic',
  'ironic': 'form.style.ironic',
  'old-fashioned': 'form.style.oldFashioned',
  'spicy': 'form.style.spicy',
};

const styleLabel = (style: string) =>
  styleKeys[style] ? t(styleKeys[style]) : style;

const firstLine = (poem: string) =>
  poem.split('\n').find(line => line.trim() !== '')?.trim() ?? '';

// Emit only after the close animation: while open, the drawer locks page
// scrolling and restores the old position on close, which would undo the
// parent's scroll to the poem.
let pending: PoemHistoryEntry | null = null;

const select = (entry: PoemHistoryEntry) => {
  pending = entry;
  open.value = false;
};

const onAfterLeave = () => {
  if (pending) emit('select', pending);
  pending = null;
};

const clearAll = () => {
  clear();
  confirmingClear.value = false;
};
</script>

<template>
  <USlideover
    v-model:open="open"
    side="right"
    @after:leave="onAfterLeave"
    :title="t('history.title')"
    :description="t('history.description')"
    :ui="{
      content: 'max-w-md bg-[#fdf6e7] divide-[#d4a853]/30',
      header: 'border-b-2 border-[#d4a853]/30',
      title: 'text-xl font-bold text-[#8b1538]',
      description: 'text-sm text-[#8b1538]/70',
      body: 'p-3 sm:p-4',
      footer: 'border-t-2 border-[#d4a853]/30 pb-[max(1rem,env(safe-area-inset-bottom))]',
    }"
  >
    <!-- Own markup so the scoped .font-cinzel below applies -->
    <template #title>
      <span class="font-cinzel">{{ t('history.title') }}</span>
    </template>

    <template #body>
      <!-- Empty state -->
      <div
        v-if="entries.length === 0"
        class="flex flex-col items-center justify-center text-center py-16 px-6"
      >
        <span class="text-6xl opacity-40 mb-4" aria-hidden="true">📜</span>
        <p class="font-cinzel text-lg font-bold text-[#8b1538]/70">
          {{ t('history.empty') }}
        </p>
        <p class="text-sm text-[#8b1538]/60 mt-2">
          {{ t('history.emptyHint') }}
        </p>
      </div>

      <!-- Poem list -->
      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="entry in entries"
          :key="entry.id"
          class="group relative rounded-xl border-2 bg-white/70 transition-colors"
          :class="entry.id === props.activeId
            ? 'border-[#8b1538] bg-[#f4cd60]/15'
            : 'border-[#d4a853]/40 hover:border-[#d4a853]'"
        >
          <button
            type="button"
            class="w-full text-left p-3 pr-14 min-h-16 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b1538]"
            :aria-current="entry.id === props.activeId ? 'true' : undefined"
            @click="select(entry)"
          >
            <span class="block font-cinzel font-bold text-[#8b1538] leading-snug break-words">
              {{ t('poem.title', { name: entry.recipient }) }}
            </span>
            <span class="block text-xs text-[#8b1538]/60 mt-1">
              {{ dateFormat.format(entry.createdAt) }}
              · {{ styleLabel(entry.style) }}
              · {{ t('history.lines', { n: entry.lines }) }}
            </span>
            <span class="block text-sm italic text-gray-700 mt-1.5 truncate">
              {{ firstLine(entry.poem) }}
            </span>
          </button>
          <UButton
            icon="i-heroicons-trash"
            color="neutral"
            variant="ghost"
            size="lg"
            class="absolute top-1.5 right-1.5 size-11 justify-center text-[#8b1538]/50 hover:text-[#b91c4a] hover:bg-[#b91c4a]/10"
            :aria-label="t('history.deleteAria', { name: entry.recipient })"
            @click="remove(entry.id)"
          />
        </li>
      </ul>
    </template>

    <template v-if="entries.length > 0" #footer>
      <div class="flex w-full items-center justify-between gap-3">
        <span class="text-xs text-[#8b1538]/60">
          {{ t('history.count', { count: entries.length }) }}
        </span>
        <div v-if="!confirmingClear">
          <UButton
            color="neutral"
            variant="ghost"
            size="lg"
            class="text-[#8b1538]"
            @click="confirmingClear = true"
          >
            {{ t('history.clearAll') }}
          </UButton>
        </div>
        <div v-else class="flex gap-2">
          <UButton color="neutral" variant="ghost" size="lg" @click="confirmingClear = false">
            {{ t('history.cancel') }}
          </UButton>
          <UButton color="error" size="lg" @click="clearAll">
            {{ t('history.confirmClear') }}
          </UButton>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>
/* app.vue sets an unlayered `* { font-family }`, which beats Tailwind
   utilities, so each component scopes its own Cinzel rule. */
.font-cinzel {
  font-family: 'Cinzel', serif;
  letter-spacing: 0.02em;
}
</style>
