<template>
    <div class="sidebar">
        <div class="icon"><font-awesome-icon icon="home"/></div>
        <div class="icon"><font-awesome-icon icon="download"/></div>
        <div class="icon"><font-awesome-icon icon="cog"/></div>
    </div>
</template>
<script>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
    components: { FontAwesomeIcon }
}
</script>
<style lang="scss" scoped>
.sidebar {
    width: 80px;
    background-color: #202225;
    height: 100%;

    padding-top: 40px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;

    .icon {
        width: 50px;
        height: 50px;
        border-radius: 50px;
        transition: border-radius 0.3s;
        cursor: pointer;

        background-color: #36393f;
        color: white;
        text-align: center;
        line-height: 50px;

        &:hover {
            border-radius: 15px;
        }

        &:not(:first-child) {
            margin-top: 10px;
        }
    }
}
</style>