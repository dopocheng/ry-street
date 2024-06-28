<template>
    <div>
    <el-dialog
      title="索引下载"
      v-model="isOpen"
      draggable
      overflow
      :modal="false"
      :close-on-click-modal="true"
      @close="handleClose"
    >
      <el-form :model="form" label-width="auto" ref="myForm" style="max-width: 600px">
        <el-form-item label="范围选择：">
          <img
            style="width: 30px; height: 29px"
            src="../../assets/street/多边形.png"
            alt=""
            srcset=""
            @click="drawArea"
          />
        </el-form-item>
        <el-form-item prop="indexValue" label="key值：">
          <el-input v-model="form.indexValue" />
        </el-form-item>
        <div v-if="backmsg">
          <el-form-item  prop="lon" label="经度">
            <el-input v-model="form.lon"></el-input>
          </el-form-item>
          <el-form-item  prop="lon" label="纬度">
            <el-input prop="lat" v-model="form.lat"></el-input>
          </el-form-item>
        </div>
        <!-- <el-form-item>
                    待下载：{{ downs.waitDown }}已下载：{{ downs.alreadyDown }}
                </el-form-item> -->
        <el-form-item>
          <el-button type="primary" @click="onSubmit">确定</el-button>
          <el-button type="primary" @click="onCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
// import axios from 'axios'
import * as turf from '@turf/turf'
import { ElMessage } from 'element-plus'
import { panoKeyApi, getIndexApi, getAlreadAPI, indexDownApi } from '../../http/indexDownAPI.js'
import { ref, unref, watch, onMounted, inject } from 'vue'
import { makeLonlat, makeArr,areaDb } from '../../api/tool.js'
export default {
  components: {},
  props: {
    showView: Boolean
  },
  emits: ['closeEmit'],
  setup(props, ctx) {
    const backmsg = ref(false)
    const myForm = ref(null) //清空 form 用
    const indexData = ref(null)
    let isOpen = ref(null)
    const form = ref({
      range: '', //范围选择
      indexValue: '', //图片索引
      lon: '',
      lat: ''
    })
    const downs = ref({
      waitDown: '10', //等待下载
      alreadyDown: '100' //已下载
    })
    const cesiumCoor = inject('cesiumCoor') //取父组件provid变量
    const cObj = inject('cObj') //取父组件provid变量
    const manaRef = inject('manaRef') //取父组件provid变量

    watch(
      () => props.showView.idshow,
      (newValue) => {
        // drawArea()
        if (newValue) {
          isOpen.value = newValue //取消弹窗，直接画区域
          // loadGoogleMapsScript().then(() => {
          //     getPanoId()
          // })
          // messages('框选开启','success')
          // drawArea()
        } else {
          // messages('框选关闭', 'warning')
          // cObj.value.closeListen()
          // cObj.value.removeEPall()
        }
      }
    )

    const drawArea = () => {
      cObj.value.removeEPall() //清除entity
      cObj.value.removeAll1() //清除primitive
      isOpen.value = false //暂时关闭弹窗
      cObj.value.startDrawing(isOpen, callback) //取消弹窗，直接画区域
    }
    const callback = () => {
      let obj = polygonPoint()
      //框选后的回调函数
      console.log('框选---') //绘点
      // loadGoogleMapsScript(obj).then(() => {
        getPanoId(obj)
      // })
      form.value.lon = obj.point[0]
      form.value.lat = obj.point[1]
      backmsg.value = true
    }

      function onSubmit(myForm) {
        // let obj = polygonPoint()
        let region = quyu()
      
        let data = {
        keyName: form.value.indexValue,
        // keyName: '122kxY36j_9RBB_H48_P8Q',
        region: JSON.stringify(region),
        // lon: '121.4236441',
          // lat: '25.2021338'
        lon: form.value.lon + '',
        lat: form.value.lat + ''
      }
      indexDownApi(data).then(res => {
          console.log(res.data)
      })
      resetForm()
    }

    const resetForm = () => {
      if (!myForm.value) return
      let form = unref(myForm.value) //这个是重要的一步
      form.resetFields()
      isOpen.value = false
      backmsg.value = false
      cObj.value.removeEPall() //清除entity
      cObj.value.removeAll1() //清除primitive
    }
    const resetForm1 = () => {
      //清空 form 表单
      form.reset()
      // 可能需要额外重置绑定的模型数据
      form.value = {
        range: '', //范围选择
        indexValue: '', //图片索引
        lon: '',
        lat: ''
      }
    }

    function onSubmit1() {
      //保存框选区域
      console.log(cesiumCoor) //或cObj.value 矩形经纬度
      let p = cesiumCoor.value[cesiumCoor.value.length - 1]
      let quyu = []
      quyu.push(p.west, p.south, p.east, p.north)
      let region = makeLonlat(quyu)
      // debugger
      let data = {
        keyName: form.value.indexValue,
        // lat: '25.078430',
        // lon: '121.571720',
        // region: "[{'lon': '121.531527','lat': '25.022567'},{'lon': '121.611206','lat': '25.022567'},{'lon': '121.611206','lat': '25.110498'},{'lon': '121.531527','lat': '25.110498'},{'lon': '121.531527','lat': '25.022567'}]",
        region: JSON.stringify(region),
        storageAddress: 'H:\\street-new\\'
      }
      panoKeyApi(data).then((res) => {
        indexData.value = res.data
        cObj.value.drawPoint(res.data)
      })
      // setInterval(() => {
      //     indexCount()
      //     alreadyCount()
      // }, 3000)

      console.log('submit!')
    }
    const alreadyCount = () => {
      //带下载
      getAlreadAPI().then((res) => {
        downs.value.alreadyDown = res.data
      })
    }
    const indexCount = () => {
      //已下载
      getIndexApi().then((res) => {
        downs.value.waitDown = res.data
      })
    }
    function messages(msg, type) {
      ElMessage({
        showClose: true,
        message: msg,
        type: type
      })
    }
    function onCancel() {
      resetForm()
      console.log('取消!')
    }
    function handleClose() {
      ctx.emit('closeEmit', { whois: 'idshow', status: false })
      resetForm()
    }
    const loadGoogleMapsScript = () => {
      return new Promise((resolve, reject) => {
        if (typeof google !== 'undefined' && google.maps) {
          resolve()
          return
        }
        const ggScript = document.createElement('script')
        ggScript.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false'
        ggScript.async = true
        ggScript.onload = resolve
        ggScript.onerror = reject
        document.head.appendChild(ggScript)
      })
    }
    const getPanoId = (latlon) => {
      //获取框选街景key
      const panoClient = new google.maps.StreetViewService() //25.078430 121.571720  25.1862566, 121.4185904
      let lonlat = new google.maps.LatLng(latlon.point[1], latlon.point[0])
      // let lonlat = new google.maps.LatLng(25.2021338, 121.4236441)
      panoClient.getPanoramaByLocation(lonlat, 50, function (result, status) {
        if (status === google.maps.StreetViewStatus.OK) {
          form.value.indexValue = result.location.pano
          console.log('街景图key---', form.value.indexValue)
          form.value.indexValue = result.location.pano
        } else {
          callback()
          // if (self.onNoPanoramaData) self.onNoPanoramaData(status)
          // self.throwError('由于以下原因，无法检索全景图: ' + status)
        }
      })
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
    function quyu2() {
      let rect = cObj.value.rectangleCoordinates
      if (rect.length > 0) {
        let quyu = []
        // let big = cObj.value.pickArea
        let p = rect[rect.length - 1]
        quyu.push(p.west, p.south, p.east, p.north)
        let region = makeArr(quyu)
        console.log('--[[]]---', region)
        return region
      }
    }
      /**
       * 
       * @param {多边形区域} polygon 
       */
      const polygonPoint = () => {
      let area = quyu2()
      let polygon = turf.polygon(area)
      // 获取多边形的外接矩形
      const bbox = turf.bbox(polygon)

      let obj = {}
      let point
      let isInside = false
      // 循环生成随机点直到点位于多边形内部
      do {
        const randomPoint = turf.randomPoint(1, { bbox: bbox })
        point = randomPoint.features[0]
        isInside = turf.booleanPointInPolygon(point, polygon)
      } while (!isInside)

      console.log('生成的点:', point.geometry.coordinates)
      console.log('该点在多边形区域内:', isInside)
        if (isInside) {
          let  coordinates = point.geometry.coordinates.map(coord => parseFloat(coord.toFixed(7)));
          console.log('0900',coordinates)
            obj.point = coordinates
            obj.area = area
        return obj
      }
    }

    onMounted(() => {
      console.log('indexDown---', cObj.value, manaRef.value) //地球组件中对象
      loadGoogleMapsScript().then((res) => {
        console.log(res)
      })
    })
      return {
        
      backmsg,//框选后回显信息
      myForm,
      form,
      drawArea,
      onSubmit,
      onCancel,
      isOpen,
      cesiumCoor,
      downs,

      polygonPoint,
      resetForm,
      handleClose,
      loadGoogleMapsScript
    }
  }
}
</script>
