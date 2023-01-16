<template>
  <ul class="menu lg:w-56 ml-4 rounded-box shadow-lg bg-white">
    <li>
      <NuxtLink to="/">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      <span class="hidden lg:inline" :title="$t('sidebar.home')">{{$t('sidebar.home')}}</span>
      </NuxtLink>
    </li>
    <li>
      <NuxtLink to="/event/new">
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19 19V8H5V19H19M16 1H18V3H19C20.11 3 21 3.9 21 5V19C21 20.11 20.11 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.89 3.89 3 5 3H6V1H8V3H16V1M11 9.5H13V12.5H16V14.5H13V17.5H11V14.5H8V12.5H11V9.5Z" />
      </svg>
        <span class="hidden lg:inline" :title="$t('sidebar.new-event')">{{$t('sidebar.new-event')}}</span>
      </NuxtLink>
    </li>
    <li>
      <NuxtLink to="/event/import">
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 12L8 16H11V22H13V16H16M19 3H18V1H16V3H8V1H6V3H5C3.9 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H9V19H5V8H19V19H15V21H19C20.11 21 21 20.11 21 19V5C21 3.9 20.11 3 19 3Z" />
      </svg>
        <span class="hidden lg:inline" :title="$t('sidebar.import-event')">{{$t('sidebar.import-event')}}</span>
      </NuxtLink>
    </li>
    <li>
      <NuxtLink to="/">
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
      </svg>
        <span class="hidden lg:inline" :title="$t('sidebar.places')">{{$t('sidebar.places')}}</span>
      </NuxtLink>
    </li>
    <li>
      <NuxtLink to="/label">
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M4 19H13L11 21H4C3.5 21 2.97 20.79 2.59 20.41C2.21 20.03 2 19.5 2 19V9H4V19M17.63 5.84C17.27 5.33 16.67 5 16 5H8C6.9 5 6 5.9 6 7V15C6 16.1 6.9 17 8 17H16C16.67 17 17.27 16.66 17.63 16.15L22 11L17.63 5.84Z" />
      </svg>
        <span class="hidden lg:inline" :title="$t('sidebar.labels')">{{$t('sidebar.labels')}}</span>
      </NuxtLink>
    </li>
    <li>
      <NuxtLink to="/display">
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M7,1A2,2 0 0,0 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3A2,2 0 0,0 17,1H7M7,4H17V20H7V4M9,6V10H10.5V7.5H13V6H9M13.5,14V16.5H11V18H15V14H13.5Z" />
      </svg>
        <span class="hidden lg:inline" :title="$t('sidebar.displays')">{{$t('sidebar.displays')}}</span>
      </NuxtLink>
    </li>
    <li>
      <NuxtLink to="/">
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M6,17C6,15 10,13.9 12,13.9C14,13.9 18,15 18,17V18H6M15,9A3,3 0 0,1 12,12A3,3 0 0,1 9,9A3,3 0 0,1 12,6A3,3 0 0,1 15,9M3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3H5C3.89,3 3,3.9 3,5Z" />
      </svg>
        <span class="hidden lg:inline" :title="$t('sidebar.profile')">{{$t('sidebar.profile')}}</span>
      </NuxtLink>
    </li>
  </ul>
</template>