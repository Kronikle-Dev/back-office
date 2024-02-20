<script setup>
const showDesktop = ref(true)
</script>

<template>
    <div class="flex flex-col space-y-2 items-center w-[100svw] h-[100svh] justify-center">
        <img src="/demo-bg.jpg" class="w-full h-full absolute object-cover"/>
        <a href="https://kronikle.eu" class="btn btn-primary btn-outline absolute top-12 left-1/2 -translate-x-1/2 bg-white">← Kronikle</a>
        <div class="hidden lg:block z-10">
            <div class="form-control">
                <label class="label cursor-pointer">
                    <span class="label-text">📱 </span> 
                    <input type="checkbox" class="toggle toggle-primary mx-4" v-model="showDesktop" checked />
                    <span class="label-text"> 🖥</span> 
                </label>
            </div>
        </div>
        <div    id="wrap"
                :class="{'lg:w-[960px]': showDesktop}"
                class="rounded-xl z-10 w-[260px] transition-all">
            <iframe id="frame" :class="{'lg:w-[1920px]': showDesktop}" class=" w-[520px] transition-all" src="https://app.kronikle.eu/d/63f376bac97be9f615bd"></iframe>
        </div>
    </div>
</template>

<style>
    #wrap { height: 540px; padding: 0; overflow: hidden; }
    #frame { height: 1080px; border: 0px; }
    #frame {
        -ms-zoom: 0.5;
        -moz-transform: scale(0.5);
        -moz-transform-origin: 0 0;
        -o-transform: scale(0.5);
        -o-transform-origin: 0 0;
        -webkit-transform: scale(0.5);
        -webkit-transform-origin: 0 0;
    }
</style>
