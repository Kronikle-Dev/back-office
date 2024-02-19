<template>
    <div class="flex items-center w-[100svw] h-[100svh] justify-center">
        <img src="/demo-bg.jpg" class="w-full h-full absolute object-cover"/>
        <a href="https://kronikle.eu" class="btn btn-primary btn-outline absolute top-12 left-1/2 -translate-x-1/2 bg-white">← Kronikle</a>
        <div    id="wrap"
                class="rounded-xl z-10 lg:w-[960px] w-[260px] transition-all">
            <iframe id="frame" class="lg:w-[1920px] w-[520px] transition-all" src="https://app.kronikle.eu/d/63f376bac97be9f615bd"></iframe>
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
