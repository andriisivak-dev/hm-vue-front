<template>
    <footer class="app-footer">
        <div class="float-end d-none d-sm-inline"></div>
        <strong>
            Copyright &copy; {{ new Date().getFullYear() }}
            <router-link to="/dashboard">hemat-tools</router-link>.
        </strong>
        All rights reserved.
    </footer>
</template>

<style scoped>
.app-footer {
    margin-top: 20px;
}
</style>
