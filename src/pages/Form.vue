<script setup lang="ts">
import FormRenderer from '../components/form/FormRenderer.vue'
</script>

<template>
  <div class="form-page">
    <div class="header-section">
      <h1>Case Study Form</h1>
      <p>Fill out the details of your successful customer implementation.</p>
    </div>
    
    <FormRenderer :form-id="4" :entry-id="35" />
  </div>
</template>

<style scoped>
.form-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-section p {
  color: var(--text);
  font-size: 1.1rem;
}
</style>