<template>
  <div class="field-skeleton">
    <div class="skeleton-label skeleton"></div>
    <div class="skeleton-input skeleton"></div>
    <div class="skeleton-desc skeleton"></div>
  </div>
</template>

<style scoped>
.field-skeleton {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-label {
  width: 40%;
  height: 18px;
}

.skeleton-input {
  width: 100%;
  height: 44px;
  border-radius: 8px;
}

.skeleton-desc {
  width: 80%;
  height: 14px;
}

/* Base Form Skeleton Animation */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton {
  background: #f1f5f9;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}

.skeleton::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  animation: shimmer 1.5s infinite;
}
</style>
