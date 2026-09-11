<script lang="ts" setup>
const props = defineProps<{ organizationName?: string }>()

defineEmits<{ 'select-ical': [] }>()

const { t } = useI18n()

// L'adresse reste ici plutôt que dans les traductions : vue-i18n traite « @ » comme
// le préfixe d'un message lié et casserait la valeur.
const CONTACT_EMAIL = 'contact@kronikle.eu'

const mailtoHref = computed(() => {
  // RFC 6068 : le corps d'un mailto attend des CRLF, sans quoi certains clients
  // (Outlook) aplatissent les sauts de ligne.
  const body = t('event.import.custom.mail-body', { organization: props.organizationName || '' })
    .replace(/\n/g, '\r\n')
  return `mailto:${CONTACT_EMAIL}`
    + `?subject=${encodeURIComponent(t('event.import.custom.mail-subject'))}`
    + `&body=${encodeURIComponent(body)}`
})

const args = ['arg-1', 'arg-2', 'arg-3']
</script>

<template>
  <div>
    <div class="alert alert-info not-prose my-4 flex-col items-start sm:flex-row sm:items-center">
      <span>{{ $t('event.import.custom.ical-first') }}</span>
      <button class="btn btn-sm btn-outline shrink-0 whitespace-nowrap" @click="$emit('select-ical')">
        {{ $t('event.import.custom.ical-first-button') }}
      </button>
    </div>

    <h3>{{ $t('event.import.custom.title') }}</h3>
    <p>{{ $t('event.import.custom.intro') }}</p>

    <ul class="flex flex-col gap-2 not-prose my-4">
      <li v-for="arg of args" :key="arg" class="flex items-start gap-2">
        <span class="badge badge-primary badge-outline shrink-0 mt-0.5">✓</span>
        <span>{{ $t(`event.import.custom.${arg}`) }}</span>
      </li>
    </ul>

    <div class="card bg-white shadow not-prose">
      <div class="card-body">
        <h4 class="card-title text-base">{{ $t('event.import.custom.cta-title') }}</h4>
        <p class="text-sm">{{ $t('event.import.custom.cta-text') }}</p>
        <div class="card-actions mt-2">
          <a :href="mailtoHref" class="btn btn-primary">{{ $t('event.import.custom.cta') }}</a>
        </div>
      </div>
    </div>
  </div>
</template>
