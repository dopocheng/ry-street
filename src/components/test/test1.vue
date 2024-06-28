<template>
    <div>
        <el-dialog title='test子组件' v-model="cpView1" @close="cpClose">
            <el-button @click="handleClick">子组件按钮</el-button>
        </el-dialog>
    </div>
</template>

<script>
import { ref, watch } from 'vue'
export default {
    name: 'TE',
    components: {},
    props: {
        parent1: Boolean
    },
    emits: ['child', 'cpCl1'],
    setup(props, ctx) {
        let cpView1 = ref(null)//初始化 cpView 值来自父组件
        const childValue = ref(1)

        watch(() => props.parent1, (newValue) => {//v3监听父组件传的动态值
            cpView1.value = newValue
            console.log('cl--33', newValue)
        }, { immediate: true, deep: true })

        function cpClose() {
            ctx.emit('cpCl1', ref(false))
            cpView1.value = false
            console.log(66)
        }
        function handleClick() {
            ctx.emit('child', childValue)
        }
        //导出---
        return {
            cpView1,
            childValue,
            handleClick,
            cpClose
        }
    }
}
</script>