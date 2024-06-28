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
    setup() {
        const cesiumContainer = ref(null)
        const drawingMode = ref(false);

        let viewer;
        let handler;
        let startPoint;
        let endPoint;
        let currentRectanglePrimitive;
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
                vrButton: false
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

            const createRectanglePrimitive = (rectangle, id) => {
                const primitive = new Cesium.Primitive({
                    geometryInstances: new Cesium.GeometryInstance({
                        geometry: new Cesium.RectangleGeometry({
                            rectangle: rectangle
                        }),
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED.withAlpha(0.5))
                        },
                        id: id // 为几何实例分配 ID
                    }),
                    appearance: new Cesium.PerInstanceColorAppearance({
                        flat: true
                    })
                });
                primitive.id = id; // 为 Primitive 分配 ID
                return primitive;
            };

            handler.setInputAction((click) => {
                startPoint = getCartographicFromMouse(click.position);
                if (startPoint) {
                    viewer.scene.screenSpaceCameraController.enableRotate = false;
                }
            }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

            handler.setInputAction((movement) => {
                if (startPoint) {
                    endPoint = getCartographicFromMouse(movement.endPosition);
                    if (endPoint) {
                        const rectangle = Cesium.Rectangle.fromCartographicArray([startPoint, endPoint]);
                        if (!currentRectanglePrimitive) {
                            const rectangleId = generateUniqueId();
                            currentRectanglePrimitive = createRectanglePrimitive(rectangle, rectangleId);
                            viewer.scene.primitives.add(currentRectanglePrimitive);
                        } else {
                            viewer.scene.primitives.remove(currentRectanglePrimitive);
                            const rectangleId = currentRectanglePrimitive.id;
                            currentRectanglePrimitive = createRectanglePrimitive(rectangle, rectangleId);
                            viewer.scene.primitives.add(currentRectanglePrimitive);
                        }
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            handler.setInputAction(() => {
                if (currentRectanglePrimitive) {
                    rectangles.value.push(currentRectanglePrimitive);
                    const coords = Cesium.Rectangle.fromCartographicArray([startPoint, endPoint]);

                    const west = Cesium.Math.toDegrees(coords.west);
                    const south = Cesium.Math.toDegrees(coords.south);
                    const east = Cesium.Math.toDegrees(coords.east);
                    const north = Cesium.Math.toDegrees(coords.north);

                    rectangleCoordinates.value.push({ id: currentRectanglePrimitive.id, west, south, east, north });
                    currentRectanglePrimitive = undefined;
                }

                startPoint = undefined;
                endPoint = undefined;
                viewer.scene.screenSpaceCameraController.enableRotate = true;
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
                if (Cesium.defined(pickedObject)) {
                    const pickedPrimitive = pickedObject.primitive;
                    const index = rectangles.value.findIndex(rect => rect.id === pickedPrimitive.id);
                    if (index !== -1) {
                        const rectangleId = pickedPrimitive.id;
                        if (confirm(`Are you sure you want to delete rectangle ${rectangleId}?`)) {
                            viewer.scene.primitives.remove(pickedPrimitive);
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