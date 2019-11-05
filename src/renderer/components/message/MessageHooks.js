import { useState, useEffect } from 'react'
import { callDcMethodAsync } from '../../ipc'
import logger from '../../../logger'

const log = logger.getLogger('renderer/components/message/MessageHooks')

export function useLoadedMessages (chatId) {
  const [messageIds, setMessageIds] = useState([])

  const fetchMessageIds = async () => {
    const messageIds = await callDcMethodAsync('messageList.getMessageIds', [chatId, 0, 0])
    console.log('hola', messageIds)
    setMessageIds(messageIds)
  }

  const [state, setState] = useState([[], {}])
  const [loadedMessageIds, messages] = state

  const getMessages = async (messageIds, force = false) => {
    const messageIdsToFetch = !force ?
      messageIds.filter((mId) => typeof messages[mId] === 'undefined') :
      messageIds

    if (messageIdsToFetch.length === 0) {
      log.debug('No messages to fetch, skipping')
      return
    }

    return await callDcMethodAsync('messageList.getMessages', [messageIdsToFetch])
  }

  const fetchMore = async (offset=100) => {
    if (messageIds.length === 0) return log.debug('fetchMore: messageIds is empty, skipping')

    const endIndex = loadedMessageIds.length > 0 ?
      messageIds.findIndex(mId => mId === loadedMessageIds[0]) :
      messageIds.length - 1

    const startIndex = endIndex - offset
    log.debug(`fetchMore: startIndex: ${startIndex} endIndex: ${endIndex}`)

    const moreMessageIds = messageIds.slice(startIndex, endIndex + 1)
    log.debug(`fetchMore: try to fetch those messageIds: ${moreMessageIds}`)
    const fetchedMessages = await getMessages(moreMessageIds)
    setState([messageIds.slice(startIndex), {...state[1], ...fetchedMessages}])
  }

  useEffect(() => {
    if (messageIds.length === 0) return
    fetchMore()
  }, [messageIds])
  useEffect(() => {
    setMessageIds([])
    fetchMessageIds()
    setState([[], {}])
  }, [chatId])

  return {loadedMessageIds, messages, fetchMore}
  
}


