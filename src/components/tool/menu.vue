<!-- src/components/MenuBar.vue -->
<template>
  <div class="menu-bar">
    <ul>
      <li v-for="item in menuItems" :key="item.text" @click="handleClick(item)">
        <a> {{ item.text }} </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const rightnav = ref({ rect: false, down: false, see: false, small: false, single: false })

// <div v-show="rightnav.single" @click="boxDelete1"> <el-icon> <Delete /> </el-icon> 删除单点</div>
const menuItems = ref([
  { text: '删除单个', value: rightnav.value.single },
  { text: 'About', link: '/about' },
  { text: 'Services', link: '/services' },
  { text: 'Contact', link: '/contact' },
]);

const handleClick = (item) => {
  console.log('Navigating to:', item);
  // 在这里你可以实现导航逻辑，例如使用 vue-router 进行导航
  // this.$router.push(item.link); // 如果你使用 vue-router
};
</script>

<style scoped>
.menu-bar {
  background-color: #333;
  width: 80px;
  /* 可根据需要调整宽度 */
  /* height: 100vh; 使菜单栏占据整个屏幕高度 */
  display: flex;
  flex-direction: column;
  /* 将子元素设置为竖向排列 */
  align-items: flex-start;
  /* 将子元素左对齐 */
}

.menu-bar ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
  width: 100%;
  /* 使菜单项占据整个宽度 */
}

.menu-bar li {
  width: 100%;
  /* 使菜单项占据整个宽度 */
}

.menu-bar li a {
  display: block;
  color: white;
  text-align: left;
  /* 左对齐 */
  padding: 14px 16px;
  text-decoration: none;
  width: 100%;
  /* 使链接占据整个宽度 */
}

.menu-bar li a:hover {
  background-color: #111;
}
</style>