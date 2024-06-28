<template>
    <div id="box">
        <Child :parent="isOPen" @child="listenChild" @cpCl="listenCp" />
        <Child1 :parent1="isOPen1" @cpCl1="listenCp1" />

        <IDown :showView="dialogs" @closeEmit="handleIdEmit" />
        <IMmana :showView="dialogs" @closeEmit="handleIdEmit" />
        <SDown :showView="dialogs" @closeEmit="handleIdEmit" />
        <Export :showView="dialogs" @closeEmit="handleIdEmit" />
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
                    </template>
                </el-menu-item>
                <el-menu-item index="2">
                    <i class="el-icon-menu"></i>
                    <template v-slot:title>
                        <span>索引管理</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="3">
                    <i class="el-icon-document"></i>
                    <template v-slot:title>
                        <span>街景下载</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="4">
                    <i class="el-icon-setting"></i>
                    <template v-slot:title>
                        <span>数据导出</span>
                    </template>
                </el-menu-item>
            </el-menu>
        </div>
        <div class="earth">
            <CesiumViewer />
        </div>
    </div>
</template>

<script>
import CesiumViewer from '../../components/earth/CesiumView.vue'
import Child from '../../components/test/ChildParent.vue'
import Child1 from '../../components/test/test1.vue'

import IDown from '../../components/dialog/IndexDownload.vue'
import IMmana from '../../components/dialog/IndexManager.vue'
import SDown from '../../components/dialog/streetViewDownload.vue'
import Export from '../../components/dialog/DataExport.vue'
import './homeIndex.css'
import { ref } from 'vue'

export default {
    name: 'App',
    components: {
        CesiumViewer,
        Child,
        Child1,

        IDown,
        IMmana,
        SDown,
        Export
    },
    setup() {
        const dialogs = ref({
            idshow: false,//索引下载
            imshow: false,//索引管理
            svdshow: false,//街景下载
            deshow: false,//导出
        })

        function handleIdEmit(res) {
            let rw = res.whois
            dialogs.value[rw] = res.status
        }

        const count = ref(5)
        let isOPen1 = ref(false)
        let isOPen = ref(false)
        const indexPage = ref(false);
        const navIndex = ref(null)

        function listenCp(data) {
            isOPen.value = data.value
            console.log(data.value)
        }
        function listenCp1(data) {
            isOPen1.value = data.value
            console.log(data.value)
        }
        function listenChild(chv) {//子组件 childValue
            console.log(chv.value)
        }
        function indexPageClose() {
            indexPage.value = false
        }
        function menuSelect(index) {
            console.log(`当前点击的菜单：${index}`);
            //点击当前的菜单页面标记问true其余为false，替代以下
            // for (let i = 0; i < whichPage.length; i++) {
            //     if (index * 1 - 1 == i) {
            //         whichPage[i][i + ''] = true
            //     } else {
            //         whichPage[i][i + ''] = false
            //     }
            // }
            switch (index * 1) {
                case 1:
                    dialogs.value.idshow = !dialogs.value.idshow
                    break;
                case 2:
                    dialogs.value.imshow = !dialogs.value.imshow
                    break;
                case 3:
                    dialogs.value.svdshow = !dialogs.value.svdshow
                    break;
                case 4:
                    dialogs.value.deshow = !dialogs.value.deshow
                    break;
                default:
                    console.log("Invalid choice");
            }
        }
        return {
            dialogs,
            handleIdEmit,

            count,
            isOPen1,
            isOPen,//组件是否显示
            navIndex,//导航条目
            indexPage,

            indexPageClose,
            menuSelect,



            listenChild,
            listenCp,
            listenCp1
        };
    }
}
</script>
