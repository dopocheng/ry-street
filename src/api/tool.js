import { panoKeyApi } from '../http/indexDownAPI.js'
import { dbIdApi } from '../http/dataExport.js'

const yb = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let res = 10
            resolve(res)//����ֵ�����ܷŵ����
        }, 3000)
    })
}

const areaIdDb = (points) => {//originalDcl/getStreetTableRegionByRegion
    return new Promise(resolve => {
        // let quyu = [121.531527, 25.022567, 121.611206, 25.110498]
        // let region = makeLonlat(quyu)//�����������
        // debugger
        let params = { region: JSON.stringify(points) }
        dbIdApi(params).then((res) => {
            resolve(res.data)
        })
    })
}
/**
 * ��ѯ�����п㣨δ����ûID��
 * @param {*} points 
 */
const areaDb = (points) => {
    return new Promise(resolve => {
        let quyu = [121.531527, 25.022567, 121.611206, 25.110498]
        let region = makeLonlat(quyu)
        // debugger
        let data = {//25.078430, 121.571720
            keyName: '',
            lat: '25.078430',
            lon: '121.571720',
            // region: "[{'lon': '121.531527','lat': '25.022567'},{'lon': '121.611206','lat': '25.022567'},{'lon': '121.611206','lat': '25.110498'},{'lon': '121.531527','lat': '25.110498'},{'lon': '121.531527','lat': '25.022567'}]",
            region: JSON.stringify(region),
            storageAddress: 'H:\\street-new\\'
        }
        panoKeyApi(data).then((res) => {
            console.log(res)
            resolve(res.data)
        })
    })
}

/**
 * [0,1,2,3]��װ5������---[{},{},{},{},{}]
 * @param {*} item 
 * @returns 
 */

const makeLonlat = (item) => {
    let arr = []
    for (let k = 0; k < 5; k++) {
        switch (k) {
            case 0:
                arr.push({ lon: item[0] + '', lat: item[1] + '' })
                break;
            case 1:
                arr.push({ lon: item[2] + '', lat: item[1] + '' })
                break;
            case 2:
                arr.push({ lon: item[2] + '', lat: item[3] + '' })
                break;
            case 3:
                arr.push({ lon: item[0] + '', lat: item[3] + '' })
                break;
            case 4:
                arr.push({ lon: item[0] + '', lat: item[1] + '' })
                break;
            default:
                console.log("Invalid choice");
        }
    }
    console.log('��װ5������[{}]---', arr)
    return arr
}
const makeArr = (item) => {
    let arr = []
    for (let k = 0; k < 5; k++) {
        switch (k) {
            case 0:
                arr.push([item[0] * 1, item[1] * 1])
                break;
            case 1:
                arr.push([item[2] * 1, item[1] * 1])
                break;
            case 2:
                arr.push([item[2] * 1, item[3] * 1])
                break;
            case 3:
                arr.push([item[0] * 1, item[3] * 1])
                break;
            case 4:
                arr.push([item[0] * 1, item[1] * 1])
                break;
            default:
                console.log("Invalid choice");
        }
    }

    console.log('��װ5������[[[]]]---', [arr])

    return [arr]
}



export {
    makeArr,
    makeLonlat,
    areaDb,
    areaIdDb,
    yb
}
