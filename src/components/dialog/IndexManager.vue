<template>
  <div>
    <el-dialog title="索引管理" draggable overflow :modal="false" :close-on-click-modal="false" v-model="isOpen"
      @close="handleClose" @opened="onDialogOpened">
      <div class="area-mana">
        <p>选择范围：</p>
        <img style="width: 30px; height: 29px" src="../../assets/street/多边形.png" alt="" srcset="" @click="drawArea" />
      </div>
      <!-- <el-button @click="deleteArea">年份删除</el-button> -->
      <el-table border stripe :data="tableData" height="400" ref="tableRef" style="width: 100%" @select-all="selectAll"
        @filter-change="filterChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="keyName" label="索引名" align="center" width="180" />
        <el-table-column prop="tableName" label="索引库名" width="180" align="center" />
        <el-table-column prop="yearMonth" label="日期" column-key="yearMonth" sortable :filters="yearClomn"
          :filter-method="filterHandler" width="180" align="center" />
        <el-table-column prop="lon" label="经度" width="180" align="center" />
        <el-table-column prop="lat" label="纬度" align="center" />
        <el-table-column label="操作" align="center">
          <template #default="scope">
            <!-- <el-button
              size="small"
              type="primary"
              :disabled="scope.row.status == 1 ? true : false"
              @click="handleCopy(scope.$index, scope.row)"
            >
              索引拷贝
            </el-button> -->
            <!-- <el-button size="small" type="primary" @click="handleCheck(scope.row)">
              查看
            </el-button> -->
            <el-button size="small" type="primary" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
    <!-- <el-button text style="position: fixed; z-index: 100; color: red" @click="table = true"
      >Open Drawer with nested table</el-button
    > -->
    <el-drawer modal-class="op" v-model="table" direction="rtl" size="100%" :with-header="true" :modal="false"
      style="right: inherit; padding-top: 0px !important">
      <YC @ycSelectEmit="handlerEmit" />
    </el-drawer>

    <div v-show="menu" class="menu" id="menu">
      <div class="menu-arrow"></div>
      <div class="menu-bar">
        <ul>
          <li v-for="item in manamenu.menuItems" :key="item.text" @click="handleClick(item)">
            <a v-show="item.dsy"> {{ item.text }} </a>
          </li>
        </ul>
      </div>
      <!-- <div v-show="rightnav.see" @click="streetPoint"> <el-icon><View /></el-icon>查看街景</div>
      <div v-show="rightnav.small" @click="boxDelete"><el-icon><Delete /></el-icon>框选删除</div>
      <div v-show="rightnav.down" @click="downStreet"> <el-icon><Download /></el-icon>下载街景</div>
      <div v-show="rightnav.single" @click="boxDelete1"> <el-icon> <Delete /> </el-icon> 删除单点</div>
      <div v-show="rightnav.rect" @click="copyStreet"> <el-icon><DocumentCopy /></el-icon>导出街景</div> -->
      <!-- <div v-show="rightnav.rect" @click="deletePickArea">删除当前区域</div> -->
      <!-- <div @click="removePoint">删除当前实体</div> -->
    </div>
    <!-- <el-button @click="dddd"> jjjjj</el-button> -->
    <!-- 统计展示 -->
    <div style="
        border: solid 1px red;
        width: 100px;
        height: 50px;
        position: fixed;
        z-index: 100;
        right: 5px;
        top: 10px;
        color: white;
      ">
      待下载：{{ waitQueue }}
    </div>

    <el-card v-if="rightDiv" style="max-width: 480px">
      <div style="float: right" @click="cardClose">
        <el-icon>
          <Close />
        </el-icon>
      </div>
      <el-descriptions column="1" direction="vertical" title="索引详情">
        <el-span v-for="(item, index) in descrip" :key="index">
          {{ index }}: {{ item }}
          <el-descriptions-item label="索引">{{ item.keyName }}</el-descriptions-item>
          <el-descriptions-item label="索引库">{{ item.tableName }}</el-descriptions-item>
          <el-descriptions-item label="年份">{{ item.yearMonth }}</el-descriptions-item>
          <el-descriptions-item label="经度">{{ item.lon }}</el-descriptions-item>
          <el-descriptions-item label="纬度">{{ item.lat }}</el-descriptions-item>
        </el-span>
      </el-descriptions>

    </el-card>
  </div>
</template>
<script>
// 引入 Turf.js 库
import * as turf from '@turf/turf'
import { onMounted, ref, watch, inject, nextTick, reactive } from 'vue'
import { areaIdDb, makeLonlat } from '../../api/tool.js'
import {
  areaAll,
  areaDb,
  yearDeleteApi,
  kuShaixuan,
  streetDownApi,
  deleteAreaApi,
  deleteOneApi,
  deletePointsApi
} from '../../http/indexMana.js'
import {
  dataCopyApi,
  deleteApi,
  yearApi,
  streetApi,
  notDownApi,
  streetQueue
} from '../../http/indexMana.js'
import * as manaApi from '../../http/indexMana.js'
import YC from '../../components/tool/YearColor.vue'
import CD from '../../components/tool/menu.vue'
export default {
  components: { YC, CD },
  props: {
    showView: Boolean
  },
  emits: ['closeEmit'],
  setup(props, ctx) {
    const rightnav = ref({ rect: false, down: false, see: false, small: false, single: false })
    const menuItems = ref(initializeMenuItems());
    // 使用 reactive 定义 manamenu 对象
    const manamenu = reactive({
      menuItems: menuItems.value,
      initializeMenuItems() {
        this.menuItems = initializeMenuItems();
      }
    });
    manamenu.initializeMenuItems();
    /**
     * 
     * @param {显示的菜单下标} index 
     */
    function toggleDsy(index) {
      manamenu.menuItems[index].dsy = true;
    }
    const yearClomn = ref([])
    const tableRef = ref([])
    const descrip = ref([])
    const rightDiv = ref(null) //点击街景详情
    let interval = null
    const waitQueue = ref(null)
    let notDown = null
    const areaList = ref(null)
    const menuDom = ref(null)
    const menu = ref(false) //右键菜单显隐
    const table = ref(false)
    const isShow = ref(false)
    const currentRect = ref(null)
    const tableData = ref([])
    let isOpen = ref(null)
    let flag = ref(null)
    const cObj = inject('cObj') //地球页面 Obj exportRef
    const exportRef = inject('exportRef') //地球页面 Obj exportRef

    watch(
      () => props.showView.imshow,
      (newValue, oldValue) => {
        // getAll()
        isOpen.value = newValue
        flag.value = newValue
        if (newValue) {
          cObj.value.boxPrimitives = []
          cObj.value.showMenuMethod('none')
            // getAll()
            ; (async () => {
              if (!interval) {
                interval = setInterval(() => {
                  getCount()
                }, 5000)
              }
              // getAll()
              await notDownApi().then((res) => {
                notDown = res.data.data
                console.log('没下载的街景---', res.data.data)
              })
            })()
        } else {
          // cObj.value.removeAll()
        }
      }
    )
    /**
     * item 初始化菜单项
     */
    function initializeMenuItems() {
      return [
        { text: '删除单个', value: 'single', dsy: false },
        { text: '框选街景', value: 'small', dsy: false },
        { text: '取消框选', value: 'cancel', dsy: false },
        { text: 'Contact', value: 4, dsy: false }
      ];
    }
    const handleClick = (item) => {
      console.log('Navigating to:', item);
      // 在这里你可以实现导航逻辑，例如使用 vue-router 进行导航
      // this.$router.push(item.link); // 如果你使用 vue-router 'boxDelete'},single
      switch (item.value) {
        case 'single':
          boxDelete1()
          break
        case 'small':
          boxDelete()
          break
        case 'cancel':
          cancelBox()
          break
      }
    };
    const onDialogOpened = () => {
      //按钮汉字化 dialog内容渲染完成后
      nextTick(() => {
        const buttons = document.querySelectorAll('.el-table-filter__bottom button')
        buttons.forEach((button) => {
          if (button.textContent.trim() === 'Confirm') {
            button.textContent = '确认'
          }
          if (button.textContent.trim() === 'Reset') {
            button.textContent = '重置'
          }
        })
      })
    }

    const filterChange = () => {
      tableRef.value.clearSelection();
    }

    const filterHandler = (value, row, column) => {
      console.log(value, row, column)
      const property = column['property']
      return row[property].substring(0, 4) === value

    }

    const cardClose = () => {
      rightDiv.value = !rightDiv.value
    }
    const divBox = () => {
      descrip.value = []
      rightDiv.value = true
      descrip.value.push(cObj.value.pickData)
      console.log('左点击详情---', descrip.value)
      // API（）
    }

    const copyStreet = () => {
      exportRef.value.isOpen = true
    }

    const getCount = () => {
      manaApi.streetQueue().then((res) => {
        waitQueue.value = res.data
        if (res.data == 0) {
          clearInterval(interval)
        }
        console.log('统计--', res.data)
      })
    }

    const downStreet = () => {
      // 在线下载街景
      console.log('55555', cObj.value.yearDb.tableName) //右击库名
      let data = { tableName: cObj.value.yearDb.tableName }
      streetDownApi(data).then((res) => {
        console.log(res.data)
      })
    }
    //框选区域删除街景点
    const removeAreaPoint = (points) => {
      // 模拟框选区域的边界框，这里假设框选区域是一个矩形，有西、东、南、北四个边界值
      // const bbox = [-75.5, 39.1, -75.3, 40]; 121.489，25.169，121.506，25.187
      const bbox = [121.651, 25.138, 121.662, 25.148]

      // 将点的数据转换为 Turf.js 的点要素
      const turfPoints = points.map((point) => turf.point([point.lon, point.lat], { id: point.id }))

      // 将边界框转换为 Turf.js 的多边形要素
      const turfBbox = turf.bboxPolygon(bbox)

      // 在框选区域内筛选点
      const selectedPoints = turfPoints.filter((point) =>
        turf.booleanPointInPolygon(point, turfBbox)
      )

      // console.log('筛选点---',selectedPoints)
      // 输出在框选区域内的点的 ID
      selectedPoints.forEach((point) => {
        console.log('kk')
      })
    }
    /**
     * 删除拾取区域
     */
    const deletePickArea = () => {
      if (cObj.value.pickArea) {
        deleteApi({ region: cObj.value.pickArea }).then((res) => {
          cObj.value.deleteRect()
          console.log(0)
          // pickRectBack(currentRect.value)
        })
      }
    }
    /**
     * copy 当前库并查询街景
     */
    const streetPoint = async () => {
      let rp = cObj.value.right_point
      if (rp && rp.region && rp.status != 1) {
        let data = {
          region: JSON.stringify(cObj.value.region),
          tableName: cObj.value.yearDb.tableName
        }
        await dataCopyApi(data).then(async (res) => {
          console.log('索引copy---')
          // pickRectBack(currentRect.value)
          // console.log('当前点击---',cObj.value.yearDb)
        })
      }
      await handleCheck(cObj.value.yearDb)
      cObj.value.showMenuMethod('none')
    }

    const cancelBox = () => {
      cObj.value.cleanRect()//删除二次框选多边形
      //全部删除重新绘制点
      callback()
    }

    const boxDelete1 = () => {
      //单个删除街景点
      let pickId = cObj.value.right_point
      deleteOneApi({ keyName: pickId.keyName, tableName: pickId.tableName }).then((res) => {
        cObj.value.showMenuMethod('none')
        //思想：1，删除前删除了所有点（使用）
        //思想：2，只删除pick点（集合点实现起来较难）
        // async function executeInOrder() {
        //   await new Promise((resolve, reject) => {
        //     cObj.value.removeOne(pickId.keyName)
        //     resolve()
        //   })
        //   tableLast()
        // }
        // executeInOrder()
        callback()
        console.log('删除街景点')
      })
    }

    const boxDelete = () => {
      if (cObj.value.boxPrimitives.length > 0) {
        console.log('选中点---', cObj.value.boxPrimitives)
        let points = cObj.value.boxPrimitives
        let arr = []
        points.forEach(item => {
          arr.push({ keyName: item.keyName, tableName: item.tableName })
        })
        console.log('--删除街景数组--', arr)
        deletePointsApi(JSON.stringify(arr)).then(res => {
          console.log('多点删除----')
          callback()
        })
        cObj.value.twodrawing('havePoint')//二次框选页面点删除
      } else if (cObj.value.rectangleCoordinates.length == 0) {
        cObj.value.startDrawing(isOpen, callback222)//一次框选
      } else if (cObj.value.rectangleCoordinates.length == 1) {
        cObj.value.startDrawing(null, callback222)//二次框选页面点改颜色
      }
      cObj.value.showMenuMethod('none')
    }
    function callback222() {
      cObj.value.twodrawing(null)
    }
    function callback22() {
      let rect = cObj.value.rectangleCoordinates
      if (rect.length > 0) {
        let quyu = []
        let big = cObj.value.pickArea
        let p = rect[rect.length - 1]
        quyu.push(p.west, p.south, p.east, p.north)
        let region = makeLonlat(quyu)
        console.log('---', JSON.stringify(region), big)
      }
      // smallBigArea()
    }
    /**
     * 删除所选街景点（按年份）
     */
    const removePoint = () => {
      cObj.value.deletePoint() //界面点删除
      //数据库删除
      console.log('6666----', cObj.value.yearDb)
      yearDeleteApi(cObj.value.yearDb).then((res) => {
        console.log('删除对应库街景----', res.data)
      })
    }

    //废弃 handleCheck（）在用
    const drawArea = () => {
      cObj.value.removeEPall() //清除entity
      cObj.value.removeAll1() //清除primitive
      cObj.value.rectangleCoordinates = []//矩形数组清空
      isOpen.value = false //暂时关闭弹窗
      cObj.value.startDrawing(isOpen, callback)
    }

    const handlerEmit = (selectObj) => {
      console.log(selectObj.value)
      cObj.value.showPoint(selectObj)
    }
    function handleClose() {
      ctx.emit('closeEmit', { whois: 'imshow', status: false })
    }
    /**
     * 回调函数绘制点
     */
    const callback = () => {
      // cObj.value.removeEPall()//清除entity
      cObj.value.removeAll1()//清除primitive
      // cObj.value.drawPoint([{ lon: 121.58, lat: 25.26 }], '2014', null)
      //框选后的回调函数
      let region = quyu()
      if (region.length > 0) {
        console.log('框选-manager--', cObj.value.rectangleCoordinates) //绘区域内街景点
        yearClomn.value = []
        tableData.value = []
        tableRef.value.clearSelection();
        tableRef.value.clearSort();
        tableRef.value.clearFilter('yearMonth');
        kuShaixuan({ smallRegion: JSON.stringify(region) }).then((res) => {
          // // 创建一个对象，键为年份，值为对应年份的日期数组
          // var datesByYear = {}
          // let yearList = []
          // // 遍历日期数据
          // res.data.forEach(function (item) {
          //   if (item.yearMonth) {
          //     var year = item.yearMonth.substring(0, 4) // 提取年份
          //     if (!datesByYear[year]) {
          //       datesByYear[year] = [] // 如果该年份不存在，则创建一个数组
          //       yearList.push(year) //储存年份，不带月份查询
          //     }
          //     datesByYear[year].push(item.yearMonth) // 将日期添加到对应年份的数组中
          //   }
          // })
          // let dataArray = Object.entries(datesByYear).map(([key, value]) => ({ [key]: value }))
          // dataArray.sort(function (a, b) {
          //   let keyA = Object.keys(a)[0]
          //   let keyB = Object.keys(b)[0]
          //   return keyA - keyB
          // })
          // console.log(dataArray)
          // console.log(datesByYear)
          let streetData = null,
            sameYear = []
          streetData = res.data
          let yearData = {}
          let y = []
          for (let ym in streetData) {
            let year = streetData[ym].yearMonth.substring(0, 4) // 提取年份
            if (!yearData[year]) {
              y.push({ text: year, value: year })
              yearData[year] = [] // 如果该年份不存在，则创建一个数组
              // yearList.push(year)//储存年份，不带月份查询
            }
            yearData[year].push(streetData[ym]) // 将相同年份的数据放到一个数组
          }

          yearClomn.value = y
          console.log('整合数据---', yearClomn.value)
          for (let year in yearData) {
            cObj.value.drawPoint(yearData[year], year, null) //按年份显示点
            // cObj.value.drawPoint(res.data, year, null)
            tableData.value = res.data

          }
          console.log(res.data)
        })
      }
    }
    function tableLast() {
      //地球街景点删除后刷新table
      let region = quyu()
      if (region.length > 0) {
        console.log('框选-maanger--', cObj.value.rectangleCoordinates) //绘区域内街景点
        kuShaixuan({ smallRegion: JSON.stringify(region) }).then((res) => {
          tableData.value = res.data
          console.log(res.data)
        })
      }
    }
    function quyu() {
      let rect = cObj.value.rectangleCoordinates
      if (rect.length > 0) {
        let quyu = []
        // let big = cObj.value.pickArea
        let p = rect[0]// 取第一个矩形，第二个矩形用于删除
        quyu.push(p.west, p.south, p.east, p.north)
        let region = makeLonlat(quyu)
        console.log('-----', region)
        return region
      }
    }

    const getAll = () => {
      areaAll().then((res) => {
        if (res.data) {
          cObj.value.removeEPall()
          cObj.value.removeAll1()
        }
        areaList.value = res.data
        cObj.value.drawRectangle(res.data, pickRectBack)
      })
    }

    const handleCopy = (index, row) => {
      let { tableName, region } = row
      let data = {
        region: JSON.stringify(region),
        tableName: tableName
      }
      dataCopyApi(data).then((res) => {
        console.log('索引copy---')
        pickRectBack(currentRect.value)
      })
      console.log(index, row)
    }

    const handleCheck = async (row) => {
      isOpen.value = false
      isShow.value = true
      let streetDb = { tableName: row.tableName }
      yearApi(streetDb).then(async (res) => {
        // 创建一个对象，键为年份，值为对应年份的日期数组
        var datesByYear = {}
        let yearList = []
        // 遍历日期数据
        res.data.forEach(function (item) {
          if (item.yearMonth) {
            var year = item.yearMonth.substring(0, 4) // 提取年份
            if (!datesByYear[year]) {
              datesByYear[year] = [] // 如果该年份不存在，则创建一个数组
              yearList.push(year) //储存年份，不带月份查询
            }
            datesByYear[year].push(item.yearMonth) // 将日期添加到对应年份的数组中
          }
        })
        let dataArray = Object.entries(datesByYear).map(([key, value]) => ({ [key]: value }))
        dataArray.sort(function (a, b) {
          let keyA = Object.keys(a)[0]
          let keyB = Object.keys(b)[0]
          return keyA - keyB
        })
        console.log(dataArray)
        console.log(datesByYear)
        let last3 = dataArray //所有
        // let last3 = dataArray.slice(-3) //取最新三年.
        let streetData = null,
          sameYear = []
        await streetApi(streetDb).then((res) => {
          streetData = res.data
          console.log('streetApi----')
        })
        let yearData = {}
        for (let ym in streetData) {
          let year = ym.substring(0, 4) // 提取年份
          if (!yearData[year]) {
            yearData[year] = [] // 如果该年份不存在，则创建一个数组
            // yearList.push(year)//储存年份，不带月份查询
          }
          yearData[year].push(...streetData[ym]) // 将相同年份的数据放到一个数组
        }
        console.log('整合数据---', yearData)
        for (let year in yearData) {
          cObj.value.drawPoint(yearData[year], year, null) //按年份显示点
        }
        // for (let j = 0; j < last3.length; j++) {
        //   let d = Object.values(last3[j])[0]
        //   for (let k = 0; k < d.length; k++) {
        //     console.log(d[k])
        //     streetDb.yearMonth = d[k]

        //     await streetApi(streetDb).then((res) => {
        //       cObj.value.drawPoint(res.data, 'streetpoint',) //日期未排序 yearApi
        //       console.log('streetApi----')
        //     })
        //   }
        // }
      })
    }
    const handleDelete = (row) => {
      deleteOneApi({ keyName: row.keyName, tableName: row.tableName }).then((res) => {
        cObj.value.showMenuMethod('none')
        // cObj.value.removeOne(row.keyName)
        callback()
        console.log('删除街景点')
      })
      // let id = scope.row.id
      // deleteApi({ id: id }).then((res) => {
      //   pickRectBack(currentRect.value)
      // })
    }
    const deleteArea = () => {
      let rect = cObj.value.rectangleCoordinates
      if (rect.length > 0) {
        let quyu = []
        // let big = cObj.value.pickArea
        let p = rect[rect.length - 1]
        quyu.push(p.west, p.south, p.east, p.north)
        let region = makeLonlat(quyu)
        console.log('-----', region, yearAll)//年份全选
        // deleteApi({ region: currentRect.value }).then((res) => {
        //   pickRectBack(currentRect.value)
        // })
      }
    }
    // smallBigArea = (small,big) => {
    //   let big
    //   let small
    //   let pp = makeLonlat([121.602, 25.093, 121.607, 25.097])
    //   console.log('筛选区域=pp==',pp)
    //   // big = makeLonlat([121.437, 25.022, 121.664, 25.150])
    //   big = [{"lon":"121.437882","lat":"25.021691"},{"lon":"121.664599","lat":"25.021691"},{"lon":"121.664599","lat":"25.150797"},{"lon":"121.437882","lat":"25.150797"},{"lon":"121.437882","lat":"25.021691"}]
    //   small = makeLonlat([121.523,25.079,121.585,25.119])
    //   let data = {bigRegion:JSON.stringify(big),smallRegion:JSON.stringify(small)}
    //   kuShaixuan(data).then(res => {
    //     console.log('筛选区域===',res)
    //   })
    //   // removeAreaPoint()
    //   menuDom.value = document.getElementById('menu')
    //   console.log('manager-ee--', menuDom.value)

    //   // cObj.value.drawPoint()
    //   // cObj.value.drawRectangle()
    //   console.log('manager---', props)
    //   console.log('manag33er5---', cObj.value)
    // }

    function pickRectBack(rect) {
      if (!currentRect.value) {
        currentRect.value = rect
      }
      let para = { region: rect }
      areaDb(para).then(async (res) => {
        // isOpen.value = true
        tableData.value = res.data
        let a = res.data
        let b = notDown
        let intersection = a.filter((obj1) => b.some((obj2) => obj2.tableName === obj1.tableName)) //交集
        let difference = a.filter((obj1) => !b.some((obj2) => obj1.tableName === obj2.tableName)) //差集a-b
        console.log(intersection, difference)
        cObj.value.drawPoint(intersection, 'dbpoint', 1) //未下载的
        cObj.value.drawPoint(difference, 'dbpoint', 2) //已下载的
      })
    }
    function dddd() {
      // cObj.value.removeAll1()//清除primitive
      let region = cObj.value.kr
      // (region[0].lon * 1).toFixed(2)
      // (region[0].lat * 1).toFixed(2)
      let db = (region[0].lon * 1).toFixed(2) + '.' + (region[0].lat * 1).toFixed(2) + '.' + 'db'
      let data = {
        region: JSON.stringify(region),
        tableName: db
      }
      console.log('5555', data, region)
      deleteAreaApi(data).then((res) => {
        console.log(0)
      })
    }
    const selectAll = (res) => {
      // yearAll.value = res
      console.log(res)
    }

    onMounted(() => {
      nextTick(() => {
        // streetDownApi({tableName:"121.42,25.20.db"}).then((res) => {
        //   console.log(res.data)
        // })
        // let big
        // let small
        // let pp = makeLonlat([121.602, 25.093, 121.607, 25.097])
        // console.log('筛选区域=pp==',pp)
        // // big = makeLonlat([121.437, 25.022, 121.664, 25.150])
        // big = [{"lon":"121.437882","lat":"25.021691"},{"lon":"121.664599","lat":"25.021691"},{"lon":"121.664599","lat":"25.150797"},{"lon":"121.437882","lat":"25.150797"},{"lon":"121.437882","lat":"25.021691"}]
        // small = makeLonlat([121.523,25.079,121.585,25.119])
        // let data = {bigRegion:JSON.stringify(big),smallRegion:JSON.stringify(small)}
        // kuShaixuan(data).then(res => {
        //   console.log('筛选区域===',res)
        // })
        // removeAreaPoint()
        menuDom.value = document.getElementById('menu')
        console.log('manager-ee--', menuDom.value)

        // cObj.value.drawPoint()
        // cObj.value.drawRectangle()
        console.log('manager---', props)
        console.log('manag33er5---', cObj.value)
      })
    })

    return {
      toggleDsy,
      manamenu,
      menuItems,//菜单列表
      yearClomn, //table 筛选年份
      descrip,
      waitQueue, //待下载队列
      areaList,
      menuDom,
      menu,
      table,
      isShow, //显示色块
      isOpen,
      tableData,
      currentRect,
      tableRef,
      dddd,
      rightDiv,
      rightnav,
      tableLast,
      cardClose, //card 关闭
      divBox,
      copyStreet,
      downStreet,
      boxDelete,
      boxDelete1,
      removeAreaPoint,
      deletePickArea,
      removePoint,
      streetPoint,
      handlerEmit,
      handleDelete,
      deleteArea,
      handleCheck,

      handleClick,//菜单选择
      handleCopy,
      drawArea,
      handleClose,
      selectAll,
      filterHandler,
      filterChange,//filter
      onDialogOpened, //dialog 内容渲染完成
      initializeMenuItems,//初始化item
    }
  }
}
</script>
<style scope>
.menu {
  /* position: fixed;
    z-index: 11;
    right: 10px;
    width: 100px;
    height: 100px;
    border: 1px solid; */
  z-index: 11;
  position: absolute;
  /* width: 200px; */
  min-height: 50px;
  max-height: 300px;
  background: #333;
  border-radius: 4px;
  box-shadow: 2px 4px 5px #888888;
}

.menu-arrow {
  position: absolute;
  left: -24px;
  top: 14px;
  width: 0;
  height: 0;
  border-top: 12px solid transparent;
  border-right: 12px solid #333;
  border-bottom: 12px solid transparent;
  border-left: 12px solid transparent;
}

.menu-bar {
  background-color: #333;
  width: 95px;
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
  padding: 3px 16px;
  text-decoration: none;
  width: 100%;
  /* 使链接占据整个宽度 */
}

.menu-bar li a:hover {
  color: yellow;
  background-color: #111;
}

.el-drawer__body {
  padding-top: 0px;
}

.el-drawer__header {
  display: flex;
  margin-bottom: 0px;
  padding: 0px;
}

.op {
  left: initial !important;
  width: 200px;
}

.area-mana {
  display: flex;
  margin-bottom: 10px;
}

.el-card__body {
  position: absolute;
  z-index: 11;
  right: 5px;
  top: 100px;
  color: black;
  border: solid, 1px;
  background: white;
  width: 300px;
}

.el-card {
  --el-card-border-color: none;
}
</style>
