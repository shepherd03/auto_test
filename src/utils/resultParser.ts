export const getReplyContent = (response: any): string => {
    return response.data.replyContent;
}

export const getReplyType = (response: any): number => {
    return response.data.replyType;
}

export const getTime = (response: any) => {
    return response.time;
}