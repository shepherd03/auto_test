import { useDirectApi, useNluApi, useQueryApi, useRectifyApi, useTestRectifyApi } from "@/api/microService"

export function useMicroService() {
    const services: Array<ServiceContent> = [
        { name: "Direct", api: useDirectApi },
        { name: "NLU", api: useNluApi },
        { name: "Query", api: useQueryApi },
        { name: "Rectify", api: useRectifyApi },
        { name: "TestRectify", api: useTestRectifyApi }
    ]

    const firstService = ref<ServiceContent>(services[0])

    const secondService = ref<ServiceContent>(services[1])

    const changeFirstService = (name: ServiceName) => {
        firstService.value = services.find((item) => item.name === name)!
    }

    const changeSecondService = (name: ServiceName) => {
        secondService.value = services.find((item) => item.name === name)!
    }

    const getServiceByName = (name: ServiceName) => {
        return services.find((item) => item.name === name)!
    }

    const runFirstService = async (msg: string) => {
        const { data } = await firstService.value.api(msg)
        return data
    }

    const runSecondService = async (msg: string) => {
        const { data } = await secondService.value.api(msg)
        return data
    }

    return {
        services,
        firstService,
        secondService,
        changeFirstService,
        changeSecondService,
        getServiceByName,
        runFirstService,
        runSecondService
    }
}