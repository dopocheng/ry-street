<template>
    <div id="box">

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

import IDown from '../../components/dialog/IndexDownload.vue'
import IMmana from '../../components/dialog/IndexManager.vue'
import SDown from '../../components/dialog/streetViewDownload.vue'
import Export from '../../components/dialog/DataExport.vue'
import './homeIndex.css'
import { onMounted, ref } from 'vue'

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

        function menuSelect(index) {
            console.log(`当前点击的菜单：${index}`);
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

        onMounted(() => {
            // console.log(handler)
        })

        return {
            dialogs,
            handleIdEmit,
            menuSelect
        }
    }
}
</script>
