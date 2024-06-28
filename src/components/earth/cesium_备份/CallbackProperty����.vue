<template>
    <div class="draw-rect">
        <el-button @click="startDrawing">绘制矩形</el-button>
        <el-button @click="addPickHandler">删除矩形</el-button>
    </div>
    <div id="cesiumContainer" ref="cesiumContainer"></div>
</template>

<script>
import { onMounted, ref } from 'vue'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import './default.css'

export default {
    name: 'CesiumViewer',
    emiteas: ['cesiumPointArr'],
    setup(props, ctx) {
        const cesiumContainer = ref(null)
        const drawingMode = ref(false);

        let viewer;
        let handler;
        let startPoint;
        let endPoint;
        let currentRectangleEntity;
        let rightClickHandler;
        const rectangles = ref([]);
        const rectangleCoordinates = ref([]);

        onMounted(() => {
            // Initialize the Cesium viewer with optimized settings
            viewer = new Cesium.Viewer(cesiumContainer.value, {//获取的是Id dom节点
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
                vrButton: false,
                sceneMode: Cesium.SceneMode.SCENE2D


            })
            addPickHandler()
        })
        const generateUniqueId = () => {
            return `rect-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        };

        const startDrawing = () => {
            drawingMode.value = true;

            handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

            const getCartographicFromMouse = (position) => {
                const ray = viewer.camera.getPickRay(position);
                const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                return cartesian ? Cesium.Cartographic.fromCartesian(cartesian) : null;
            };

            handler.setInputAction((click) => {
                startPoint = getCartographicFromMouse(click.position);
                if (startPoint) {
                    viewer.scene.screenSpaceCameraController.enableRotate = false;
                    viewer.scene.screenSpaceCameraController.enableTranslate = false;//2d模式禁�?地图移动
                }
            }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

            handler.setInputAction((movement) => {
                if (startPoint) {
                    endPoint = getCartographicFromMouse(movement.endPosition);
                    if (endPoint) {
                        const rectangle = new Cesium.CallbackProperty(() => {
                            if (startPoint && endPoint) {
                                return Cesium.Rectangle.fromCartographicArray([startPoint, endPoint]);
                            }
                            return undefined;
                        }, false);

                        if (!currentRectangleEntity) {
                            const rectangleId = generateUniqueId();
                            currentRectangleEntity = viewer.entities.add({
                                id: rectangleId,
                                rectangle: {
                                    material: Cesium.Color.TRANSPARENT.withAlpha(0.3), // 半透明颜色
                                    outline: false,
                                    outlineColor: Cesium.Color.RED, // 边�?颜色
                                    outlineWidth: 30, // 边�?宽度
                                    // material: Cesium.Color.TRANSPARENT,

                                    // outline: true,
                                    // outlineColor: Cesium.Color.RED

                                }
                            });
                        } else {
                            currentRectangleEntity.rectangle.coordinates = rectangle;
                        }
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            handler.setInputAction(() => {
                if (currentRectangleEntity && startPoint && endPoint) {
                    const finalRectangle = Cesium.Rectangle.fromCartographicArray([startPoint, endPoint]);
                    currentRectangleEntity.rectangle.coordinates = finalRectangle;

                    rectangles.value.push(currentRectangleEntity);

                    const west = Cesium.Math.toDegrees(finalRectangle.west).toFixed(6);
                    const south = Cesium.Math.toDegrees(finalRectangle.south).toFixed(6);
                    const east = Cesium.Math.toDegrees(finalRectangle.east).toFixed(6);
                    const north = Cesium.Math.toDegrees(finalRectangle.north).toFixed(6);

                    rectangleCoordinates.value.push({ id: currentRectangleEntity.id, west, south, east, north });

                    console.log('获取点数�?---', rectangleCoordinates.value[0])
                    currentRectangleEntity = undefined;
                }
                ctx.emit('cesiumPointArr', rectangleCoordinates)
                startPoint = undefined;
                endPoint = undefined;
                viewer.scene.screenSpaceCameraController.enableRotate = true;
                viewer.scene.screenSpaceCameraController.enableTranslate = true;//开�?��标拖�?
                drawingMode.value = false;
                handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
                handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
            }, Cesium.ScreenSpaceEventType.LEFT_UP);
        };

        const addPickHandler = () => {
            if (rightClickHandler) {
                rightClickHandler.destroy();
            }
            rightClickHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

            rightClickHandler.setInputAction((click) => {
                const pickedObject = viewer.scene.pick(click.position);
                if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
                    const pickedEntity = pickedObject.id;
                    const index = rectangles.value.findIndex(rect => rect.id === pickedEntity.id);
                    if (index !== -1) {
                        const rectangleId = pickedEntity.id;
                        if (confirm(`Are you sure you want to delete rectangle ${rectangleId}?`)) {
                            viewer.entities.remove(pickedEntity);
                            rectangles.value.splice(index, 1);
                            rectangleCoordinates.value.splice(index, 1);
                        }
                    }
                }
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        };

        return {
            drawingMode,
            cesiumContainer,
            rectangleCoordinates,

            startDrawing,
            addPickHandler,
            generateUniqueId
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
</style>