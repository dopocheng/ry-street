//绘制矩形
let startPoint;
let endPoint;
let rectangle;
const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

// 获取屏幕坐标对应的地理坐标
const getCartographicFromMouse = (position) => {
    const ray = viewer.camera.getPickRay(position);
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    return cartesian ? Cesium.Cartographic.fromCartesian(cartesian) : null;
};

// 开始绘制矩形
handler.setInputAction((click) => {
    startPoint = getCartographicFromMouse(click.position);
    if (startPoint) {
        // 禁用旋转
        viewer.scene.screenSpaceCameraController.enableRotate = false;
    }
}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

// 更新矩形
handler.setInputAction((movement) => {
    if (startPoint) {
        endPoint = getCartographicFromMouse(movement.endPosition);
        if (endPoint) {
            if (!rectangle) {
                rectangle = viewer.entities.add({
                    rectangle: {
                        coordinates: Cesium.Rectangle.fromCartographicArray([startPoint, endPoint]),
                        material: Cesium.Color.RED.withAlpha(0.5)
                    }
                });
            } else {
                rectangle.rectangle.coordinates = Cesium.Rectangle.fromCartographicArray([startPoint, endPoint]);
            }
        }
    }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

// 结束绘制
handler.setInputAction(() => {
    startPoint = undefined;
    endPoint = undefined;
    // 重新启用旋转
    viewer.scene.screenSpaceCameraController.enableRotate = true;

    // 关闭绘制模式
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
}, Cesium.ScreenSpaceEventType.LEFT_UP);