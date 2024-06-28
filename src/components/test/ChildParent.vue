<template>
    <div>
        <el-dialog title='子组件' v-model="cpView" @close="cpClose">
            <el-button @click="handleClick">子组件按钮</el-button>
        </el-dialog>
    </div>
</template>

<script>
import { ref, watch } from 'vue'
export default {
    name: 'CP',
    components: {},
    props: {
        parent: Boolean
    },
    emits: ['child', 'cpCl'],
    setup(props, ctx) {
        let cpView = ref(null)//初始化 cpView 值来自父组件
        const childValue = ref(1)

        watch(() => props.parent, (newValue) => {//v3监听父组件传的动态值
            cpView.value = newValue
            console.log('cl--33', newValue)
        }, { immediate: true, deep: true })

        function cpClose() {
            ctx.emit('cpCl', ref(false))
            cpView.value = false
            console.log(66)
        }
        function handleClick() {
            ctx.emit('child', childValue)
        }
        //导出---
        return {
            cpView,
            childValue,
            handleClick,
            cpClose
        }
    }
}
</script>