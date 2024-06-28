<template>
  <div>
    <el-dialog title="街景导出" 
      draggable
      overflow
      :modal="false"
      :close-on-click-modal="false"
      v-model="isOpen"
      @close="handleClose">
      <div>
        范围选择：<img
          style="width: 30px; height: 29px"
          src="../../assets/street/多边形.png"
          alt=""
          srcset=""
          @click="drawArea"
        />
      </div>
      <div class="m-4">
        <!-- <el-cascader v-model="value" :options="options" @change="handleChange(value)" /> -->
      </div>
      <el-select v-model="selectvValue" placeholder="选择路径" style="width: 240px" @change="handleChange">
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
      <el-button @click="areaE">区域导出</el-button>
      <!-- <div class="export-path">导出路径：
                <div class="input-box">
                    <div id="output">{{ output }}</div><input style="width:69px" @change="pp" type="file"
                        webkitdirectory directory>
                </div>
                <el-button type="primary" @click="submit">开始导出</el-button>
            </div> -->
      <el-table :data="tableData" stripe border height="400" style="width: 100%">
        <!-- <el-table-column prop="id" label="id" align="center" /> -->
        <el-table-column prop="tableName" label="库名" width="180" align="center" />
        <el-table-column prop="lon" label="经度" width="180" align="center" />
        <el-table-column prop="lat" label="纬度" align="center" />
        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleExport(scope.$index, scope.row)">
              导出
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>
<script>
import { ref, watch, inject, onMounted } from 'vue'

import { makeLonlat, yb, areaIdDb } from '../../api/tool.js'
import { dataCopyApi, dbIdApi, areaCopyApi, diskLetterApi, currentAreaApi } from '../../http/dataExport.js'
export default {
  components: {},
  props: {
    showView: Object
  },
  emits: ['closeEmit'],
  setup(props, ctx) {
    const selectvValue = ref([])
    let temp = []
    const options = ref([])
    let isOpen = ref(null)
    const output = ref('')
    const cObj = inject('cObj') //地球页面 Obj
    const tableData = ref([])

    watch(
      () => props.showView.deshow,
      (newValue) => {
        isOpen.value = newValue
        if (isOpen.value) {
          ; (async () => {
            handleChange('')
          })()
        }
      }
    )
    
    watch(() => isOpen.value, (newValue, oldValue) => {
      ; (async () => {
        if (cObj.value.pickArea) {
          tableData.value = await areaIdDb(JSON.parse(cObj.value.pickArea))
          handleChange('')
         }
          })()
    });

    const handleChange = (args) => { //获取文件夹路径
      console.log('--', args)
      diskLetterApi({path:args}).then(res => {
        temp = []
        res.data.forEach(item => {
          temp.push({ value: item, label: item })
        })
        // console.log('--',res.data)
        options.value = temp
      }) 
    }
    const pp = (e) => {
      const files = e.target.files
      output.value = files[0].webkitRelativePath
    }
    const drawArea = () => {
      cObj.value.removeEPall()//清除entity
        cObj.value.removeAll1()//清除primitive
      // cObj.value.removeEPall()
      // cObj.value.removeAll1()//删除点后（primitive） 再次框选报错（entity）
      isOpen.value = false //暂时关闭弹窗 removeAll1
      cObj.value.startDrawing(isOpen, callback)
    }

    const callback = async (args) => {//框选后的回调函数
      let region = quyu()
      if (region.length > 0) {
        currentAreaApi({ region: JSON.stringify(region) }).then(res => {
          let arr = res.data
          tableData.value = res.data  
          cObj.value.drawPoint(arr,'dbpoint',null)
          // console.log(res.data)
        })
      }
    }

    // 导出
    const submit = () => {
      let rc = cObj.value.rectangleCoordinates
      let p = rc[rc.length - 1]
      let points = []
      points.push(p.west, p.south, p.east, p.north)
      let region = makeLonlat(points)
      console.log('submit---', region) //绘点

      dataCopyApi().then((res) => {
        console.log('导出===', res)
      })
    }

    const areaE = (area) => {//按区域导出
      let region = quyu()
      if (region.length > 0) {
        let data = { region: region, targetPath: selectvValue.value }
        // areaCopyApi(data).then(res => {
        //   console.log('---',res.data)
        // })
        cObj.value.showMenuMethod('none')
        console.log('区域导出---',data)
      }
    } 
    const handleExport = (index, row) => {
      let { tableName, region } = row
      let data = {
        copyPath: selectvValue.value,
        // region: JSON.stringify(region),
        tableName: tableName
      }

      areaCopyApi(data).then(res => {
          console.log('---',res.data)
        })
      dataCopyApi(data).then((res) => {
        console.log('ddd')
      })
      console.log('row 导出--',data)
    }

    function handleClose() {
      ctx.emit('closeEmit', { whois: 'deshow', status: false })
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
    onMounted(() => {})
    return {
      selectvValue,
      handleChange,
      options,
      isOpen,
      output,
      tableData,

      areaE,
      handleExport,
      pp,
      submit,
      drawArea,
      handleClose
    }
  }
}
</script>

<style>
#output {
  width: calc(100% - 69px);
}

.export-path {
  display: flex;
}

.input-box {
  display: flex;
  border: solid 1px;
}
</style>
