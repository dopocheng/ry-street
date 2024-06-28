<template>
  <div id="box">
    <IDown :showView="dialogs" @closeEmit="handleIdEmit" />
    <IMmana :showView="dialogs" @closeEmit="handleIdEmit" ref="manaRef"/>
    <SDown :showView="dialogs" @closeEmit="handleIdEmit" />
    <Export :showView="dialogs" @closeEmit="handleIdEmit" ref="exportRef"/>
    
    <div class="nav">
            <el-menu class="el-menu-vertical-demo" @select="menuSelect" background-color="#545c64" text-color="#fff"
                active-text-color="#ffd04b">
                <div class="menu-title">
                    <h5>街景下载管理工具</h5>
                </div>
                <el-menu-item index="1">
                    <i class="el-icon-location"></i>
                    <template v-slot:title>
                        <span>索引下载</span>
                        <!-- <span>区域框选</span> -->
                        <!-- <span class="old" :class="{ 'active': activeIndex === '1' }">区域框选</span> -->
                    </template>
                </el-menu-item>
                <el-menu-item index="2">
                    <i class="el-icon-menu"></i>
                    <template v-slot:title>
                        <span>索引管理</span>
                        <!-- <span>区域管理</span> -->
                    </template>
                </el-menu-item>
                <el-menu-item index="3">
                    <i class="el-icon-document"></i>
                    <template v-slot:title>
                        <span>街景下载</span>
                        <!-- <span>索引下载</span> -->
                    </template>
                </el-menu-item>
                <el-menu-item index="4">
                    <i class="el-icon-setting"></i>
                    <template v-slot:title>
                        <span>街景导出</span>
                    </template>
                </el-menu-item>
            </el-menu>
        </div>
    <div class="earth">
      <CesiumViewer ref="cesiumRef" />
    </div>
  </div>
</template>

<script>
import CesiumViewer from '../../components/earth/CesiumView.vue'
import IDown from '../../components/dialog/IndexDownload.vue'
import IMmana from '../../components/dialog/IndexManager.vue'
import SDown from '../../components/dialog/streetViewDownload.vue'
import Export from '../../components/dialog/DataExport.vue'

import './homeIndex.css'
import { onMounted, ref, provide } from 'vue'
// import { getONe } from '../../http/indexDownAPI.js'

export default {
  name: 'App',
  components: {
    CesiumViewer,
    IDown,
    IMmana,
    SDown,
    Export
  },
  setup() {
    let activeIndex = ref('')
     const ispen = ref(true)
    // const db = ref(null)
    const dialogs = ref({
      idshow: false, //索引下载
      imshow: false, //索引管理
      svdshow: false, //街景下载
      deshow: false, //导出
    })
    // const cObj = ref(null)
    const cesiumRef = ref(null) //取 cesiumView 页面的 viewer manaRef
    const manaRef = ref(null) //取 cesiumView 页面的 viewer manaRef
    const exportRef = ref(null) //取 cesiumView 页面的 viewer manaRef
    //兄弟组件传值
    const cesiumCoor = ref('')
    const updateCoor = (newValue) => {
      cesiumCoor.value = newValue
    }
    provide('cesiumCoor', cesiumCoor)

    provide('updateCoor', updateCoor)
    provide('cObj', cesiumRef)
    provide('manaRef', manaRef)
    provide('exportRef', exportRef)


    function handleIdEmit(res) {
      let rw = res.whois
      dialogs.value[rw] = res.status
    }

    function menuSelect(index) {
      console.log(`当前点击的菜单：${index}`)
      if (activeIndex.value === index) {
        activeIndex.value = ''; // 如果点击的是当前活动的菜单项，则取消选中
        // cesiumRef.value.closeListen()
        //     cesiumRef.value.removeEPall()
      } else {
        activeIndex.value = index; // 否则设置为当前点击的菜单项的索引
      }
      switch (index * 1) {
        case 1:
          dialogs.value.idshow = !dialogs.value.idshow
          // dialogs.value.idshow = true
          // dialogs.value.imshow = false
          break
        case 2:
          dialogs.value.imshow = !dialogs.value.imshow
          // dialogs.value.imshow = true
          // dialogs.value.idshow = false
          // if (dialogs.value.idshow) {
            // cesiumRef.value.closeListen()
            // cesiumRef.value.removeEPall()；；
          // }
          break
        case 3:
          dialogs.value.svdshow = !dialogs.value.svdshow
          break
        case 4:
          dialogs.value.deshow = !dialogs.value.deshow
          
          break
        default:
          console.log('Invalid choice')
      }
    }
    // const getONe = () => {//GET 请求
    //     getONe('para')
    //         .then(res => {
    //             console.log(res)
    //         })
    // }
    onMounted(() => {
      console.log('999===', cesiumRef.value.rectangleCoordinates)
      // cObj.value = cesiumRef.value
    })

    return {
      activeIndex,//控制导航颜色
      ispen,
      dialogs,
      cesiumRef,
      manaRef,
      exportRef,
      cesiumCoor,
      // cObj,
      handleIdEmit,
      menuSelect
    }
  }
}
</script>
<style>
.old{
  color: #ffff
}
span.active {
  color: #ffd04b ; /*#fff8 #ffd04b*/
}
</style>
