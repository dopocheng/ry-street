<template>
  <div class="draw-rect">
    <div class="lonlat">
      <p>经度：{{ postion.lon }}</p>
      <p style="width: 10px"></p>
      <p>纬度：{{ postion.lat }}</p>
    </div>
    <div id="popupDom" class="popupDom"></div>
    <!-- <el-button @click="shaixuan">筛选点</el-button> -->
    <!-- <el-button @click="startDrawing">绘制矩形</el-button>
        <el-button @click="addPickHandler">删除矩形</el-button> -->
  </div>
  <div id="cesiumContainer" ref="cesiumContainer"></div>
</template>

<script>
import { areaIdDb, makeLonlat, makeArr } from '../../api/tool.js'
import { onMounted, ref, inject } from 'vue'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import './default.css'
import * as turf from '@turf/turf'

import { yearDeleteApi } from '../../http/indexMana.js'

export default {
  name: 'CesiumViewer',
  emites: ['cesiumPointArr'],
  setup() {
    let boxPrimitives = ref([])//二次框选的primitive
    let labelEntities = null//label
    let kr = ref(null)
    let pickData = ref(null)
    let rectanglePrimitive = null
    let instances = []// GeometryInstance 矩形集合
    let menuDom //右键菜单 Dom
    let dom = null //需展示的 DOM
    let right_tive = { primitive: null, color: null } //右键拾取 primitive
    let pickedPointEntity //删除当前点集合
    let rightPrimitive = null
    // const pointCollection = ref(null)//此定义集合右键删除不掉当前点击年份实体
    const right_point = ref({ region: null, status: null, keyName: null, tableName: null })
    const pickArea = ref(null)
    const yearDb = ref({ yearMonth: null, tableName: null })
    let areaAll = ref(null) //所有区域
    let tempBack = null //保存回调函数
    const cesiumContainer = ref(null)
    const drawingMode = ref(false)
    const postion = ref({
      lon: '',
      lat: ''
    })
    const handler = ref(null)
    let isInit = false

    let viewer

    let startPoint
    let endPoint
    let currentRectangleEntity
    let rightClickHandler
    const rectangles = ref([])
    const rectangleCoordinates = ref([])//框选矩形集合

    const updateCoor = inject('updateCoor')
    const manaRef = inject('manaRef') //地球页面 Obj

    onMounted(() => {
      menuDom = document.getElementById('menu')
      // Initialize the Cesium viewer with optimized settings
      viewer = new Cesium.Viewer(cesiumContainer.value, {
        //获取的是Id dom节点
        // terrainProvider: Cesium.createWorldTerrain(),
        animation: false,
        timeline: false,
        scene3DOnly: true,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        fullscreenButton: false,
        vrButton: false
        // sceneMode: Cesium.SceneMode.SCENE2D//开启2D
      })
      // 设置初始位置和方向
      viewer.scene.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(121.55, 25.05, 100000), // 经度和纬度,
        orientation: new Cesium.HeadingPitchRoll.fromDegrees(0, -90, 0), // 方向（heading）、俯仰（pitch）和滚动（roll）,
        endTransform: Cesium.Matrix4.IDENTITY
      })
      handler.value = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

      // addPickHandler() //拾取、删除矩形监听
      // lonlatShow()//显示经纬度
      // movePosition()

    })
    const generateUniqueId = () => {
      return `_$${Date.now()}`
    }
    /******************测试************** */

    /**
     * 绘制矩形
     * @param {*} navIndex //暂时关闭弹框的下标
     * @param {*} callback //回调函数被（navIndex：2-绘制点;）
     */
    const startDrawing = (navIndex, callback) => {
      drawingMode.value = true
      // handler.value = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

      const getCartographicFromMouse = (position) => {
        const ray = viewer.camera.getPickRay(position)
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene)
        return cartesian ? Cesium.Cartographic.fromCartesian(cartesian) : null
      }

      handler.value.setInputAction((click) => {
        startPoint = getCartographicFromMouse(click.position)
        if (startPoint) {
          viewer.scene.screenSpaceCameraController.enableRotate = false
          viewer.scene.screenSpaceCameraController.enableTranslate = false //2d模式禁止地图移动
        }
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

      const recTimeId = generateUniqueId()
      handler.value.setInputAction((movement) => {
        if (startPoint) {
          endPoint = getCartographicFromMouse(movement.endPosition)
          if (endPoint) {
            const rectangle = new Cesium.CallbackProperty(() => {
              if (startPoint && endPoint) {
                return Cesium.Rectangle.fromCartographicArray([startPoint, endPoint])
              }
              return undefined
            }, false)

            if (!currentRectangleEntity) {
              console.log(recTimeId)
              currentRectangleEntity = viewer.entities.add({
                id: 'rect' + recTimeId,
                name: 'rectangle',
                rectangle: {
                  material: Cesium.Color.RED.withAlpha(0.2), // 半透明颜色
                  outline: false,
                  outlineColor: Cesium.Color.RED, // 边框颜色
                  outlineWidth: 30 // 边框宽度
                  // material: Cesium.Color.TRANSPARENT,
                  // outline: true
                }
              })
            } else {
              currentRectangleEntity.rectangle.coordinates = rectangle
            }
          }
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

      handler.value.setInputAction(() => {
        if (currentRectangleEntity && startPoint && endPoint) {
          const finalRectangle = Cesium.Rectangle.fromCartographicArray([startPoint, endPoint])
          currentRectangleEntity.rectangle.coordinates = finalRectangle

          rectangles.value.push(currentRectangleEntity)

          const west = Cesium.Math.toDegrees(finalRectangle.west).toFixed(6)
          const south = Cesium.Math.toDegrees(finalRectangle.south).toFixed(6)
          const east = Cesium.Math.toDegrees(finalRectangle.east).toFixed(6)
          const north = Cesium.Math.toDegrees(finalRectangle.north).toFixed(6)


          rectangleCoordinates.value.push({
            id: currentRectangleEntity.id,
            west,
            south,
            east,
            north
          })
          let onRect = rectangleCoordinates.value

          console.log('获取点数据---', onRect[onRect.length - 1])
          let quyu = []
          // let big = cObj.value.pickArea
          let p = onRect[onRect.length - 1]
          quyu.push(p.west, p.south, p.east, p.north)
          kr.value = makeLonlat(quyu)
          console.log('----kkkk-', kr.value)

          if (labelEntities) {
            // 清理上一个矩形的标签
            labelEntities.forEach(entity => {
              viewer.entities.remove(entity);
            });
            labelEntities = [];
          }

          let rectangleCoords = makeArr(quyu)
          rectangleCoords[0].forEach((coord, index) => {
            if (index == 0 || index == 2) {
              viewer.entities.add({
                id: 'label' + index + recTimeId,
                position: Cesium.Cartesian3.fromDegrees(coord[0], coord[1]),
                label: {
                  text: `${coord[0].toFixed(7)}, ${coord[1].toFixed(7)}`,
                  font: '13pt monospace',
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  outlineWidth: 2,
                  verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                  pixelOffset: new Cesium.Cartesian2(0, -9),
                  fillColor: Cesium.Color.YELLOW
                }
              });
            }
          });

          currentRectangleEntity = undefined
        }
        updateCoor(rectangleCoordinates.value)
        if (navIndex) navIndex.value = true //打开暂时关闭的弹窗
        // closeListen()
        // ctx.emit('cesiumPointArr', rectangleCoordinates)
        startPoint = undefined
        endPoint = undefined
        viewer.scene.screenSpaceCameraController.enableRotate = true
        viewer.scene.screenSpaceCameraController.enableTranslate = true //开启鼠标拖拽
        drawingMode.value = false
        handler.value.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN)
        handler.value.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        handler.value.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP)
        console.log('88888', handler)
        callback(handler)
      }, Cesium.ScreenSpaceEventType.LEFT_UP)
    }
    //7777777
    const closeListen = () => {
      startPoint = undefined
      endPoint = undefined
      viewer.scene.screenSpaceCameraController.enableRotate = true
      viewer.scene.screenSpaceCameraController.enableTranslate = true //开启鼠标拖拽
      drawingMode.value = false
      handler.value.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN)
      handler.value.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
      handler.value.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP)
      console.log('88888', handler)
    }
    /**
     * 右击删除矩形
     */
    const addPickHandler = () => {
      if (rightClickHandler) {
        rightClickHandler.destroy()
      }
      rightClickHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)

      rightClickHandler.setInputAction((click) => {
        const pickedObject = viewer.scene.pick(click.position)
        if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
          const pickedEntity = pickedObject.id
          const index = rectangles.value.findIndex((rect) => rect.id === pickedEntity.id)
          if (index !== -1) {
            const rectangleId = pickedEntity.id
            if (confirm(`Are you sure you want to delete rectangle ${rectangleId}?`)) {
              viewer.entities.remove(pickedEntity)
              rectangles.value.splice(index, 1)
              rectangleCoordinates.value.splice(index, 1)
            }
          }
        }
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }
    /**
     * 1.鼠标移动显示
     * 2.点击拾取点输出坐标
     */
    const pickShow = (position, alertOnClick = false) => {
      const cartesian = viewer.camera.pickEllipsoid(position)
      if (cartesian) {
        const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian)
        const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6)
        const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6)
        if (alertOnClick) {
          // alert(`Clicked at\nLat: ${latitude}\nLon: ${longitude}`);
          console.log(`--s-- Clicked at Lat: ${latitude} Lon: ${longitude}`)
        } else {
          postion.value.lon = longitude
          postion.value.lat = latitude
          // displayDiv.innerText = `Lat: ${latitude}, Lon: ${longitude}`;
        }
      } else if (!alertOnClick) {
        postion.value.lon = ''
        postion.value.lat = ''
        // displayDiv.innerText = 'Out of globe';
      }
    }

    const movePosition = () => {
      //控制鼠标移动时显示坐标，单击输出经纬度坐标
      handler.value.setInputAction((movement) => {
        pickShow(movement.endPosition)
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

      handler.value.setInputAction((movement) => {
        pickShow(movement.position, true)
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }
    /**
     *
     * @param {矩形区域} arr
     * @param {回调函数} back
     */
    const drawRectangle = (arr, back) => {
      console.log(arr)
      areaAll.value = arr
      tempBack = back
      let rectangless = []
      for (let i = 0; i < arr.length; i++) {
        let wsen = [] //西南东北两点
        let oo = JSON.parse(arr[i])
        for (let j = 0; j < oo.length; j++) {
          if (j == 0 || j == 2) {
            wsen.push(oo[j].lon, oo[j].lat)
          }
        }
        rectangless.push(wsen)
      }
      console.log('yaohua----', rectangless)

      rectangless.forEach((rect, index) => {
        var instance = new Cesium.GeometryInstance({
          id: 'rect_' + index,
          type: 'RectangleB',
          geometry: new Cesium.RectangleGeometry({
            ellipsoid: Cesium.Ellipsoid.WGS84,
            rectangle: Cesium.Rectangle.fromDegrees(
              rect[0] * 1,
              rect[1] * 1,
              rect[2] * 1,
              rect[3] * 1
            ),
            height: 0,
            type: 'RectangleA'
          }),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
              // new Cesium.Color(0.0, 0.0, 1.0, 0.4)
              Cesium.Color.BLUE.withAlpha(0.2)
            )
          },
          type: 'RectangleA' // Add a name attribute
        })
        instance.type = 'rectangleA'
        instances.push(instance)
      })
      // 创建一个材质，设置透明度
      // const material = Cesium.Material.fromType('Color')
      // material.uniforms.color = new Cesium.Color(0.0, 0.0, 1.0, 0.0)
      // 根据几何实例数组创建图元
      const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance({
          flat: true,
          translucent: true,
          // material: material // 设置材质
        })
      })

      // 将图元添加到集合
      viewer.scene.primitives.add(primitive)
      // popup1()
      // 启动左击右击监听（拾取点，矩形）
      let leftClickHandlerFunc = viewer.screenSpaceEventHandler.setInputAction(
        leftClickHandler,
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      )
      let rightClickHandlerFunc = viewer.screenSpaceEventHandler.setInputAction(
        rightClickHandler1,
        Cesium.ScreenSpaceEventType.RIGHT_CLICK
      )
    }
    /**
     *
     * @param {绘制点的数据} arr
     * @param {库的/街景的} pointtype
     */
    const drawPoint = (arr, pointtype, dn, rm) => {
      //分区域绘点
      if (arr.length > 0) {
        let color, t = ' ', idd = null
        if (pointtype && pointtype.length == 4) {
          color = getColorForYear(pointtype * 1)
          t = 'street'
        }
        console.log(color)
        var pointCollection = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection())
        arr.forEach((item, index) => {
          if (rm) {
            pointtype = item.year
            color = getColorForYear(pointtype * 1)
            t = 'street'
            idd = item.id
          }
          if (dn && dn == 1) color = Cesium.Color.BLUE
          if (dn && dn == 2) color = Cesium.Color.GREEN
          const point1 = pointCollection.add({
            id: idd ? idd : 'point_$' + pointtype + '_$' + item.tableName + '_$' + index + '_$' + (item.region ? item.region : '') + '_$' + item.status + '_$' + item.lon + '_$' + item.lat + '_$' + item.keyName,
            position: new Cesium.Cartesian3.fromDegrees(item.lon * 1, item.lat * 1, 0),
            color: color ? color : Cesium.Color.YELLOW,
          })
          point1.keyName = item.keyName ? item.keyName : 'dpc'
          point1.lon = item.lon ? item.lon : 'dpc'
          point1.lat = item.lat ? item.lat : 'dpc'
          point1.tableName = item.tableName ? item.tableName : 'dpc'
          pointCollection.type = item.tableName + pointtype + ''
          pointCollection.street = t

        })
        // 启动左击右击监听（拾取点，矩形）
        let leftClickHandlerFunc = viewer.screenSpaceEventHandler.setInputAction(
          leftClickHandler,
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        )
        let rightClickHandlerFunc = viewer.screenSpaceEventHandler.setInputAction(
          rightClickHandler1,
          Cesium.ScreenSpaceEventType.RIGHT_CLICK
        )
      } else {
        this.$message('区域内没有点---')
      }
      // popup1()
    }
    //气泡
    const popup1 = () => {
      // let popupDom = document.getElementById('popupDom')
      let cartesian
      let pickedPointEntity = null // Store the picked point entity
      // Function to handle left-click and right-click events
      clickHandler(click, isRightClick)

      function removeEventListeners() {
        viewer.screenSpaceEventHandler.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_CLICK,
          leftClickHandlerFunc
        )
        viewer.screenSpaceEventHandler.removeInputAction(
          Cesium.ScreenSpaceEventType.RIGHT_CLICK,
          rightClickHandlerFunc
        )
        viewer.scene.postRender.removeEventListener(renderPopup)
      }
    }
    const popup = () => {
      let popupDom = document.getElementById('popupDom')
      let cartesian
      handler.value.setInputAction((click) => {
        cartesian = undefined
        let position = click.position
        // 转换屏幕坐标到世界坐标
        let pick = viewer.scene.pick(position)
        // viewer.scene.primitives.remove(pick.collection)
        if (pick.collection) {
          switch (pick.collection.type) {
            case 'point':
              console.log('获取到点！')
              // 屏幕坐标转世界坐标——关键点
              const ellipsoid = viewer.scene.globe.ellipsoid
              cartesian = viewer.camera.pickEllipsoid(click.position, ellipsoid)
              //将笛卡尔坐标转换为地理坐标
              const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
              //将弧度转为度的十进制度表示
              const lon = Cesium.Math.toDegrees(cartographic.longitude)
              const lat = Cesium.Math.toDegrees(cartographic.latitude)
              let click_point = Cesium.Cartesian3.fromDegrees(lon, lat)
              console.log(click_point)
              if (cartesian) {
                initTool(popupDom)
                // 显示弹出式窗口
                popupDom.style.display = 'block'

                //监听目标点屏幕位置移动并更新气泡位置 viewer.scene.frameState
                viewer.scene.postRender.addEventListener(function renderPopup(e) {
                  renderFun(popupDom, click_point)
                })
              }
              break
            case '矩形':
              break
            default:
              console.log('没有实体！')
          }
        } else {
          console.log('删除渲染监听---')
          viewer.scene.postRender.removeEventListener(renderFun)
          // 隐藏弹出式窗口
          popupDom.style.display = 'none'
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }
    const initTool = (frameDiv) => {
      if (isInit) {
        return 0
      }
      const elementToRemove = document.querySelector('.tooltipdiv-right')
      if (elementToRemove) {
        elementToRemove.remove()
      }
      //弹窗容器div
      const rightdiv = document.createElement('DIV')
      rightdiv.className = 'tooltipdiv-right'
      rightdiv.style = `
      position:absolute;
      width:200px;
      min-height:100px;
      max-height:300px;
      background:#fff;
      border-radius:4px;
      box-shadow: 2px 4px 5px #888888;
      `

      //弹窗箭头div
      const arrow = document.createElement('DIV')
      arrow.className = 'tooltip-arrow'
      arrow.style = `
      position:absolute;
      left:-24px;
      top:38px;
      width:0;
      height:0;
      border-top: 12px solid transparent;
      border-right: 12px solid #fff;
      border-bottom: 12px solid transparent;
      border-left: 12px solid transparent;`
      rightdiv.appendChild(arrow)
      //标题div
      const title = document.createElement('DIV')
      title.className = 'tooltipdiv-inner'
      title.style = `
      width:100%;
      height:25px;
      line-height:25px;
      text-align:center;
      background:red;
      `
      rightdiv.appendChild(title)

      //内容div
      const content = document.createElement('DIV')
      content.className = 'tooltipdiv-content'
      content.style = `
      width:200px;
      height:250px;
      box-sizing:border-box;
      padding:10px 0 10px 10px;
      overflow-y:scroll;
      word-break:break-all;
      `
      rightdiv.appendChild(content)
      content.addEventListener('click', function (event) {
        yearDeleteApi(yearDb.value).then((res) => {
          console.log(res)
        })
        console.log('点击事件已触发', event, yearDb)
      })

      // addDiv = rightdiv;
      // addtitle = title;
      // addcontent = content;
      frameDiv.appendChild(rightdiv)

      // isInit = !isInit;
    }
    const renderFun = (popupDom, click_point, key) => {
      let winpos = viewer.scene.cartesianToCanvasCoordinates(click_point)
      if (key == 'menu') {
        popupDom.style.left = winpos.x + 16 + 'px'
        popupDom.style.top = winpos.y - 52 + 'px'
        console.log('移动-3--')
      } else {
        popupDom.style.left = winpos.x - 170 + 'px'
        popupDom.style.top = winpos.y - popupDom.offsetHeight - 49 + 'px'
        console.log('移动-2--')
      }
    }
    function getColorForYear(year) {
      // Example logic: assign colors based on modulus operation
      var colorIndex = year % 3 // Modulus 15 for 15 different colors
      switch (colorIndex) {
        case 0:
          return Cesium.Color.BLUE
        case 1:
          return Cesium.Color.BROWN
        case 2:
          return Cesium.Color.DARKGRAY
        case 3:
          return Cesium.Color.SEAGREEN
        case 4:
          return Cesium.Color.PURPLE
        case 5:
          return Cesium.Color.OLIVE
        case 6:
          return Cesium.Color.CYAN
        case 7:
          return Cesium.Color.MAGENTA
        case 8:
          return Cesium.Color.LIME
        case 9:
          return Cesium.Color.PINK
        case 10:
          return Cesium.Color.SALMON
        case 11:
          return Cesium.Color.TURQUOISE
        case 12:
          return Cesium.Color.ROYALBLUE
        case 13:
          return Cesium.Color.INDIGO
        case 14:
          return Cesium.Color.SILVER
        default:
          return Cesium.Color.WHITE // Default color
      }
    }

    /** */
    const showPoint = (selectObj) => {
      let yt = yearDb.value.tableName + selectObj.value.year + ''
      let primitives = viewer.scene.primitives._primitives
      primitives.forEach((item) => {
        if (yt == item.type) {
          console.log(item)
          item.show = selectObj.value.selected
        }
      })
    }

    const deletePoint = () => {
      if (!pickedPointEntity) {
        console.log('No point entity to delete!')
        return
      }
      manaRef.value.menu = false
      viewer.scene.primitives.remove(pickedPointEntity)
      pickedPointEntity = null
      console.log('当年街景已删除----')
    }

    const deleteRect1 = () => {
      // 假设您已经从页面上选择了要删除的矩形的索引，假设索引为 indexToRemove
      // if (1 >= 0 && 1 < instances.length) {
      if (instances.length > 0) {
        // 从 instances 数组中删除要删除的 GeometryInstance
        instances.splice(1, 1)

        console.log(rightPrimitive)
        var instanceToRemove = instances[1]; // 获取要删除的几何实例

        // 从地球上删除特定的 Primitive
        viewer.scene.primitives.remove(instanceToRemove);

        // 从 instances 数组中删除相应的几何实例
        instances.splice(1, 1);

        // 请求重新渲染场景
        viewer.scene.requestRender();

        // 从地球上删除相应的 Primitive
        viewer.scene.primitives.removeAll() // 首先清空所有 Primitive
        //   // 创建一个材质，设置透明度
        // const material = Cesium.Material.fromType('Color')
        // material.uniforms.color = new Cesium.Color(1.0, 0.0, 0.0, 0.3)
        //   instances.forEach((instance) => {
        //     viewer.scene.primitives.add(
        //       new Cesium.Primitive({
        //         geometryInstances: instance,
        //         appearance: new Cesium.PerInstanceColorAppearance({
        //           flat: true,
        //           translucent: false,
        //           material: material // 设置材质
        //         })
        //       })
        //     )
        //   })

        // 请求重新渲染场景
        // viewer.scene.requestRender()
      }
    }


    const deleteRect = () => {
      viewer.scene.primitives.remove(rightPrimitive)
      setTimeout(() => {
        viewer.scene.requestRender()
      }, 1000)
    }
    /*********************************************** 拾取点处理 *************************/
    function clickHandler(click, isRightClick) {
      let popupDom = document.getElementById('popupDom')
      // let menuDom = document.getElementById('menu')
      let position = click.position
      // Pick the entity at the clicked position
      //屏幕坐标转换
      let ellipsoid = viewer.scene.globe.ellipsoid
      let cartesian = viewer.camera.pickEllipsoid(position, ellipsoid)
      let cartographic = Cesium.Cartographic.fromCartesian(cartesian)
      let lon = Cesium.Math.toDegrees(cartographic.longitude)
      let lat = Cesium.Math.toDegrees(cartographic.latitude)
      let click_point = Cesium.Cartesian3.fromDegrees(lon, lat)
      console.log(click_point)

      let pick = viewer.scene.pick(position)
      if (pick) {
        let who
        if (typeof pick.id === 'string') {
          who = pick.id.split('_$')
        } else if (typeof pick.id === 'object' && pick.id !== null) {
          who = pick.id.id.split('_$')
        }

        switch (who[0]) {
          case 'point':
            pointCode(pick, isRightClick, position, click_point)
            break
          case 'rect':
            if (isRightClick) {
              // pickArea.value = manaRef.value.areaList[who[1]]
              rightPrimitive = pick.primitive
              showMenuMethod('block')
              menuDom.style.display = 'block'
              manaRef.value.manamenu.initializeMenuItems()//初始化 item
              // manaRef.value.menuItems.dsy = true 
              if (boxPrimitives.value.length > 0) {
                manaRef.value.manamenu.menuItems[1].text = '删除街景'
                manaRef.value.toggleDsy(2) //框选删除
              }
              manaRef.value.toggleDsy(1) //框选删除
              viewer.scene.postRender.addEventListener(function renderPopup(e) {
                renderFun(menuDom, click_point, 'menu')
              })
            } else {
              showMenuMethod('none')
              // tempBack(areaAll.value[who[1]])//单击矩形触发事件
            }
            popupDom.style.display = 'none'
            break
          default:
            console.log('无匹配---')
        }

        // viewer.scene.postRender.addEventListener(function renderPopup(e) {
        //   renderFun(dom, click_point,key)
        // })
      } else {
        popupDom.style.display = 'none'
        // menuDom.style.display = 'none'//
        showMenuMethod('none')
        if (right_tive.primitive) {//right_tive 不为null
          right_tive.primitive.color = right_tive.color
        }
      }
    }

    function pointCode(pick, isRightClick, position, click_point) {
      let key = null
      //屏幕坐标转换
      // let ellipsoid = viewer.scene.globe.ellipsoid
      // let cartesian = viewer.camera.pickEllipsoid(position, ellipsoid)
      // let cartographic = Cesium.Cartographic.fromCartesian(cartesian)
      // let lon = Cesium.Math.toDegrees(cartographic.longitude)
      // let lat = Cesium.Math.toDegrees(cartographic.latitude)
      // let click_point = Cesium.Cartesian3.fromDegrees(lon, lat)
      // console.log(click_point)
      // let right_tive = {primitive:null,color:null}
      let temp = null
      pick.collection._pointPrimitives.forEach((item, index) => {
        if (item.id == pick.id) {
          if (right_tive.primitive) {
            right_tive.primitive.color = right_tive.color
          }
          temp = pick.collection.get(index)
          right_tive.color = temp.color.clone()
          right_tive.primitive = temp
          temp.color = Cesium.Color.RED
        }
      })

      let who1 = pick.id.split('_$'), yearPick = who1[1], dbPick = who1[2]

      yearDb.value.yearMonth = yearPick
      yearDb.value.tableName = dbPick
      //判断点且区分左击右击事件
      if (isRightClick) {
        if (yearPick == 'dbpoint') {
          manaRef.value.initializeMenuItems()//初始化 item
          manaRef.value.menuItems.dsy = true//下载item
          manaRef.value.menuItems.dsy = true//c查看街景item
          right_point.value.region = who1[4]
          right_point.value.status = who1[5]
          console.log('右击库-', yearDb, manaRef.value.menuDom)
        } else {
          right_point.value.keyName = who1[8]
          right_point.value.tableName = who1[2]
          manaRef.value.manamenu.initializeMenuItems()//初始化 item
          manaRef.value.toggleDsy(0)//单点删除
          // manaRef.value.menuItems[0].dsy = true//删除单点
          console.log('删除单街景点个点')
          pickedPointEntity = pick.collection
          console.log('右击--点信息--', yearDb)
        }
        manaRef.value.menu = true //打开右键菜单
        showMenuMethod('block')
        key = 'menu'
        dom = manaRef.value.menuDom
        viewer.scene.postRender.addEventListener(function renderPopup(e) {
          renderFun(dom, click_point, key)
        })
      } else {
        let p = pick.id.split('_$')
        pickData.value = { keyName: p[8], yearMonth: p[1], tableName: p[2], lon: p[6], lat: p[7] }
        manaRef.value.divBox()
        // key = 'popu'
        // dom = popupDom
        // initTool(popupDom)
        // popupDom.style.display = 'block'
        // popupDom.querySelector('.tooltipdiv-inner').textContent = '子节点的文本内容'
        // if (yearPick.length == 4) {
        //   popupDom.querySelector('.tooltipdiv-content').textContent = `删除${yearPick}年街景?`
        //   yearDb.value.yearMonth = yearPick
        // } else {
        //   popupDom.querySelector('.tooltipdiv-content').textContent = `删除${dbPick}库?`
        // }
        // pick.id.split('_$')
        // Listen for the post-render event to update the popup position
        // viewer.scene.postRender.addEventListener(function renderPopup(e) {
        //   renderFun(popupDom, click_point)
        // })
        // }
        // } else {
        //   console.log('No point entity' + (isRightClick ? ' to delete!' : ' picked!'))
        //   console.log('删除渲染监听---')
        //   viewer.scene.postRender.removeEventListener(renderFun)
        //   // 隐藏弹出式窗口
        //   popupDom.style.display = 'none'
        // }
      }
      // viewer.scene.postRender.addEventListener(function renderPopup(e) {
      //   renderFun(dom, click_point, key)
      // })
    }

    function showMenuMethod(status) {
      menuDom.style.display = status + ''
    }
    function quyu2() {
      let rect = rectangleCoordinates.value
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
    const twodrawing = (arg) => { //二次框选矩形
      // let area = quyu2()
      // var pt = turf.point([121.422705, 25.202110]);
      // var poly = turf.polygon(area);
      // turf.booleanPointInPolygon(pt, poly);
      // if (boxPrimitives.value.length > 0) {
      //   let text = '删除区域内街景'
      //   for (let i = boxPrimitives.value.length - 1; i >= 0; i--) {
      //     viewer.scene.primitives.get(i).remove(item)//删除街景点
      //   }
      // }
      let collections = viewer.scene.primitives
      let area = quyu2()
      var poly = turf.polygon(area);
      // turf.point([-77, 44])
      boxPrimitives.value = []
      for (var i = 0; i < collections.length; i++) {
        if (collections.get(i).street == 'street') {
          let points = collections.get(i)._pointPrimitives
          points.forEach(item => {
            let isTrue = isPointInRectangle(item, poly)
            if (isTrue) {
              if (arg == 'havePoint') {//二次框选有点，执行删除
                viewer.scene.primitives.get(i).remove(item)//删除街景点
              } else {//二次框选没点，执行添加、变色
                boxPrimitives.value.push(item)//保存二次框选的primitive，用于table删除、点删除、取消删除变色
                item.color = new Cesium.Color(1.0, 0.65, 0.0, 1)//框选变色
              }
            }
          })
        }
      }
      if (arg == 'havePoint' || !(boxPrimitives.value.length > 0)) {//二次框选进入
        cleanRect()
      }
    }
    function cleanRect() {
      boxPrimitives.value = []
      removeEPall('one')
      rectangleCoordinates.value.pop()
      showMenuMethod('none')
    }
    function isPointInRectangle(item, poly) {//点是否在多边形内
      var pt = turf.point([item.lon * 1, item.lat * 1]);
      return turf.booleanPointInPolygon(pt, poly)
    }
    /***************************************************** 删除实体（entity/primitive）****************************/
    const removeOne = (keyName) => {
      var primitives = viewer.scene.primitives;
      for (let i = 0; i < primitives.length; i++) {
        let pr = primitives.get(i)
        let arrPrimitive = primitives.get(i)._pointPrimitives
        if (arrPrimitive && pr.street == "street") {
          for (let j = 0; j < arrPrimitive.length; j++) {
            if (arrPrimitive[j].keyName == keyName) {
              console.log(pr)
              primitives.remove(pr);//清空
              arrPrimitive.splice(j, 1)
              let arr = []
              arrPrimitive.forEach(item => {
                let idmsg = item.id.split('_$')
                arr.push({ id: item.id, year: idmsg[1], lon: idmsg[2], lon: idmsg[6], lat: idmsg[7], keyName: idmsg[8] })

              })
              drawPoint(arrPrimitive, null, null, 'zh')//再画
              // return
            }
          }
        }
      }
    }
    const removeEPall = (one) => {
      let allEntities = viewer.entities.values
      let accordEntity = []//存放满足条件的 entity
      let sp = null
      if (one == 'one') {
        allEntities.forEach(function (entity) {
          sp = entity.id.split('_$')
          accordEntity.push({ ey: entity, timeId: sp[1] })
        })
        accordEntity.sort(function (a, b) {//数组排序找到二次框选的矩形
          return a.timeId - b.timeId;//降序
        })
        let deleArr = accordEntity.splice(3)
        if (deleArr.length > 0) {
          deleArr.forEach(e => {
            viewer.entities.remove(e.ey)
          })
        }
        // viewer.entities.removeById(`rect_$${accordEntity[0]}`)
        console.log('Entity name: ' + accordEntity);
        viewer.entities.remove(viewer.scene.primitives.get(1))
      } else {
        viewer.entities.removeAll()
      }
    }

    /**
     * 清除地球所有
     */
    const removeAll1 = () => {
      // var scene = viewer.scene;
      //  var pointCollection = scene.primitives;
      //  pointCollection.removeAll();
      //  viewer.scene.primitives.removeAll()
      var primitives = viewer.scene.primitives;
      let temp = primitives
      for (var i = temp.length - 1; i > 0; i--) {
        let pr = primitives.get(i)
        if (pr.street == "street" || pr.street == " ") {
          console.log(pr)
          primitives.remove(pr);
        }
      }
      // instances = []
    }

    /***************************************************** 监听事件处理 ******************************************/

    let leftClickHandler = function (click) {
      // 左点击事件
      clickHandler(click, false)
    }

    // 右点击事件
    let rightClickHandler1 = function (click) {
      // 移除之前的右击事件
      // viewer.screenSpaceEventHandler.removeInputAction(
      //   Cesium.ScreenSpaceEventType.RIGHT_CLICK,
      //   rightClickHandler
      // )
      clickHandler(click, true)
    }
    const shaixuan = () => {
      // viewer.scene.primitives
      let collection = viewer.scene.primitives._primitives, points = []
      collection.forEach((p, i) => {
        if (p.street && p.street == 'street') {
          p._pointPrimitives.forEach((item, k) => {
            let msg = item.id.split("_")
            let point = { id: item.id, lon: msg[6], lat: msg[7] }
            points.push(point)
          })
        }
      })
      manaRef.value.removeAreaPoint(points)
    }


    return {
      boxPrimitives,//二次框选点
      kr,
      pickData,//左击点信息
      right_point,
      pickArea,
      yearDb,
      handler,
      postion,
      drawingMode,
      cesiumContainer,
      rectangleCoordinates,//矩形集合

      cleanRect,
      twodrawing,//二次改变点颜色
      removeOne,
      removeEPall,
      removeAll1,
      deleteRect,
      showMenuMethod,
      deletePoint,
      showPoint,
      drawPoint, //绘点
      startDrawing, //画矩形  （鼠标）
      drawRectangle, //画矩形  （点位生成）
      addPickHandler,
      generateUniqueId,
      pickShow,
      closeListen
      // shaixuan
    }
  }
}
</script>

<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.popupDom {
  margin: 0;
  padding: 0;
  position: absolute;
  z-index: 1000;
  display: none;
}
</style>
