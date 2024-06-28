<template>
  <!-- 勾选年份显示对应的街景 -->
  <div>
    <!-- <el-table
      ref="multipleTableRef"
      :data="colorData"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="5" />
      <el-table-column label="Date" width="100">
        <template #default="scope">{{ scope.row.date }}</template>
      </el-table-column>
      <el-table-column property="name" label="Name" width="100" />
      <el-table-column property="address" label="Address" show-overflow-tooltip />
    </el-table> -->
    <div>
      {{ allIn ? '全选' : '反选' }}
      <input type="checkbox" v-model="allIn" @change="handleAll(allIn)" />
    </div>
    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Color</th>
          <th>Select</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in colorData" :key="index">
          <td>{{ item.year }}</td>
          <td>
            <div :style="{ backgroundColor: item.color }" class="color-box"></div>
          </td>
          <td>
            <input
              type="checkbox"
              v-model="item.selected"
              @change="handleCheckboxChange(item)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
  import { ref, watch, onMounted, inject } from 'vue'
export default {
  components: {},
  props: {
    showView: Boolean
  },
  emits: ['ycSelectEmit'],
  setup(props, ctx) {
    const selectObj = ref([])
    const cObj = inject('cObj') //地球页面 Obj
    const allIn = ref(false)
    const colorData = ref([])

    const handleAll = (value) => {
      console.log('all---', value)
      colorData.value.forEach((item) => {
        item.selected = value
      })
      console.log('yearColor---', cObj.value.yearDb)
    }
    const handleCheckboxChange = (item) => {

      // selecteArr.push(year)
      if (item) {
        selectObj.value = item
        ctx.emit('ycSelectEmit',selectObj)
        // selecteArr.value = []
        // colorData.value.forEach(item => {
        // })
        console.log('Year ' + item.selected + ' selected')
      }
    }
    const populateColorData = (year, selected) => {
      for (var year = 2024; year >= 2006; year--) {
        var color = getColorForYear(year)
        colorData.value.push({ year: year, color: color, selected: true })
      }
      allIn.value = true
    }
    const getColorForYear = (year) => {
      var colorIndex = year % 15
      switch (colorIndex) {
        case 0:
          return 'blue'
        case 1:
          return 'brown'
        case 2:
          return 'darkgray'
        case 3:
          return 'seagreen'
        case 4:
          return 'purple'
        case 5:
          return 'olive'
        case 6:
          return 'cyan'
        case 7:
          return 'magenta'
        case 8:
          return 'lime'
        case 9:
          return 'pink'
        case 10:
          return 'salmon'
        case 11:
          return 'turquoise'
        case 12:
          return 'royalblue'
        case 13:
          return 'indigo'
        case 14:
          return 'silver'
        default:
          return 'white'
      }
    }

    onMounted(() => {
      populateColorData()
      console.log('yearColor---', cObj.value.yearDb) //地球组件中对象
    })
    return {
      allIn,
      colorData,
      selectObj,

      handleAll,
      colorData,
      handleCheckboxChange
    }
  }
}
</script>

<style scoped>
table {
  border-collapse: collapse;
  width: 100%;
}
th,
td {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}
th {
  background-color: #f2f2f2;
}
.color-box {
  width: 20px;
  height: 20px;
  display: inline-block;
  border: 1px solid #000;
}
</style>
