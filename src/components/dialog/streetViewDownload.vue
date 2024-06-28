<template>
    <div>
        <el-dialog title="街景下载" v-model="isOpen" @close="handleClose">
            <div class="tablOne">
                <div>
                    范围选择：<img
                    style="width: 30px; height: 29px"
                    src="../../assets/street/多边形.png"
                    alt=""
                    srcset=""
                    @click="drawArea"
                    />
                </div>
                <el-form class="form-db" :inline="true" :model="form">
                    <el-form-item label="索引库">
                        <el-select v-model="form.library" placeholder="请选择" style="width: 240px">
                            <el-option
                                v-for="item in options"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="下载年份">
                        <el-date-picker v-model="form.year"    type="year" placeholder="选择日期" format="YYYY"
                            value-format="YYYY">
                        </el-date-picker>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="search">搜索</el-button>
                    </el-form-item>
                </el-form>
                <div><el-button type="primary" @click="download">街景下载</el-button><el-button type="primary"
                        @click="handleComparison">下载比对</el-button></div>
                <el-table :data="indexTable" stripe border height="300" style="width: 100%" @select="handleSelect">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="tableName" width="180" label="索引库名" />
                    <el-table-column prop="lon" label="经度" width="100" />
                    <el-table-column prop="lat" label="纬度" width="100" />
                    <el-table-column prop="lat" label="总索引数" width="100" />
                    <el-table-column prop="lat" label="已下载" width="100" />
                    <el-table-column prop="status" label="状态"  >
                        <template #default="scope">
                            <span>{{scope.row.status == 0 ? "未下载" : "已下载" }}</span>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div class="tableTwo" v-show="comparison">
                <p class="tableTwo-title">下载比对</p>
                <el-button type="primary">全部重新下载</el-button>
                <el-table :data="tableData" stripe border  height="300" style="width: 100%">
                    <el-table-column type="index" width="50" />
                    <el-table-column prop="near" label=" 索引库编号" width="180" >
                        {{ selectTableN.tableName }}
                    </el-table-column>
                    <el-table-column prop="keyName" label=" 索引编号" width="250" />
                    <el-table-column prop="yearMonth" label=" 年份" />
                    <el-table-column label="操作" align="center">
                        <template #default="scope">
                            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">
                                删除
                            </el-button>
                            <el-button size="small" @click="handleDown(scope.$index, scope.row)">
                                重新下载
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-dialog>
    </div>
</template>
<script>
import { ref, watch, inject } from 'vue'
import { makeLonlat, yb, areaIdDb } from '../../api/tool.js'
import { dataCopyApi, dbIdApi, areaCopyApi, diskLetterApi, currentAreaApi } from '../../http/dataExport.js'
import { contrastApi, streetDownApi } from '../../http/streetDown'
export default {
    components: {},
    props: {
        showView: Boolean
    },
    emits: ['closeEmit'],
    setup(props, ctx) {
        
        let selectTableN = ref(null)//选中的库
        let indexTable = ref([])//下拉框数据
        let isOpen = ref(null)
        const form = ref({ library: '', year: '' })
        const value = ref('2021-10-29')
        const options = ref([])
        let tableData = ref([])
        const comparison = ref(false)
        const cObj = inject('cObj') //地球页面 Obj

        watch(() => props.showView.svdshow, (newValue) => {
            isOpen.value = newValue
        })
        const download = () => {
            if (selectTableN) {// 测试库 121.42,25.20.db selectTableN.tableName
                streetDownApi({tableName:"121.42,25.20.db"}).then((res) => {
                    console.log(res.data)
                })  
            }
        }
        function handleSelect(slt, row) {//取最后一个
            selectTableN.value = slt[slt.length -1]
            console.log(slt)
        }
        function drawArea() {
            cObj.value.removeEPall()//清除entity
        cObj.value.removeAll1()//清除primitive
            console.log('ppoo')
            isOpen.value = false //暂时关闭弹窗 removeAll1
            cObj.value.startDrawing(isOpen, callback)
        }
        function callback() { 
            let region = quyu()
            if (region.length > 0) {  
                currentAreaApi({ region: JSON.stringify(region) }).then(res => {
                    let arr = res.data
                    let o = []
                    arr.forEach(item => {
                        o.push({value:item.tableName,label:item.tableName})
                    })
                    options.value = o
                indexTable.value = arr
                cObj.value.drawPoint(arr,'dbpoint',null)
                // console.log(res.data)
                })
            }
        }
        
        const indexDb = () => {//索引库下拉
            indexApi().then(res => {
                console.log('indexDb--',res.data)
            })
        }

        const handleDelete = () => {
            console.log('删除--')
        }
        const handleDown = () => {
            console.log('下载--')
        }
        const handleComparison = () => {//下载比对按钮
            comparison.value = true
            if (selectTableN) {//测试库121.42,25.20.db  selectTableN.tableName
                contrastApi({ tableName: '121.42,25.20.db' }).then(res => {
                    let b = res.data.index,a=res.data.street
                    let difference = a.filter((obj1) => !b.some((obj2) => obj1.keyName === obj2.keyName)) //差集a-b
                    console.log('yy', res.data)
                    tableData.value = difference
                })
            }
        }
        function handleClose() {
            comparison.value = false
            ctx.emit('closeEmit', { 'whois': 'svdshow', 'status': false })
        }
        function search() {
            let data = form.value
            dbApi().then(res => {
                console.log(res.data)
            })
            console.log()
        } 
        function quyu() {
            let rect = cObj.value.rectangleCoordinates
            if (rect.length > 0) {
                let quyu = []
                // let big = cObj.value.pickArea
                let p = rect[rect.length - 1]
                quyu.push(p.west, p.south, p.east, p.north)
                let region = makeLonlat(quyu)
                console.log('-----', region)
                return region
            }
        }
        return {
            selectTableN,//check库
            indexTable,
            options,//库下拉框
            // tableData,//d对比数据
            isOpen,
            form,
            tableData,
            value,
            comparison,//比对table

            download,//在线下载街景
            handleSelect,//监听checkbox
            drawArea,
            handleComparison,
            handleDelete,
            handleDown,
            handleClose,
            search
        }
    }
}
</script>
<style>
form.el-form.el-form--default.el-form--label-right.el-form--inline.form-db {
    display: flex;
}
.tableTwo-title {
    color: var(--el-text-color-primary);
    font-size: var(--el-dialog-title-font-size);
    line-height: var(--el-dialog-font-line-height);
    padding-bottom: var(--el-dialog-padding-primary);
    padding: var(--el-dialog-padding-primary)
}
</style>
