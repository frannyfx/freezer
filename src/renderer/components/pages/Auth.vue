<template>
	<div class="wrapper">
		<p>You're not logged into Deezer.</p>
		<div class="button" @click="login">Log in</div>
	</div>
</template>
<script>
import { ipcRenderer } from "electron";

export default {
	methods: {
		login() {
			ipcRenderer.send("login");
		}
	}
}
</script>
<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

h1 {
	margin-top: 0;
}

.button {
	box-sizing: border-box;
	padding: 15px 30px;
	background-color: #00aaff;
	border-radius: 30px;
	font-size: 0.9em;

	transition: transform 0.3s;
	cursor: pointer;

	&:hover {
		transform: scale(1.1);
	}

	&:active {
		transition: transform 0.1s;
		transform: scale(0.9);
	}
}
</style>