const React = require('react')
const C = require('deltachat-node/constants')
const { ipcRenderer } = require('electron')
const {
  Button, ButtonGroup
} = require('@blueprintjs/core')
const ScreenContext = require('../contexts/ScreenContext')

const MessageWrapper = require('./message/MessageWrapper')
const Attachment = require('./message/Attachment')

const GROUPS = {
  images: {
    values: [C.DC_MSG_GIF, C.DC_MSG_IMAGE]
  },
  video: {
    values: [C.DC_MSG_VIDEO]
  },
  audio: {
    values: [C.DC_MSG_AUDIO, C.DC_MSG_VOICE]
  },
  documents: {
    values: [C.DC_MSG_FILE]
  }
}

const DEFAULT_STATE = {
  id: 'images',
  msgTypes: GROUPS.images.values,
  medias: []
}

class Media extends React.Component {
  constructor (props) {
    super(props)
    this.state = DEFAULT_STATE
  }

  componentDidMount () {
    this.onSelect(this.state.id)
  }

  componentDidUpdate (prevProps) {
    if (!prevProps.chat || (this.props.chat.id !== prevProps.chat.id)) {
      this.onSelect(this.state.id)
    }
  }

  componentWillUnmount () {
    this.setState(DEFAULT_STATE)
  }

  onSelect (id) {
    const msgTypes = GROUPS[id].values
    const medias = ipcRenderer.sendSync(
      'getChatMedia',
      msgTypes[0],
      msgTypes[1]
    )
    this.setState({ id, msgTypes, medias })
  }

  onClickMedia (message) {
    const attachment = message.msg.attachment
    if (
      message.filemime === 'application/octet-stream' &&
      !(Attachment.isVideo(attachment) || Attachment.isImage(attachment))
    ) {
      message.onDownload()
    } else {
      this.context.openDialog('RenderMedia', { message })
    }
  }

  render () {
    const { medias } = this.state
    const tx = window.translate
    return <div className='media-view'>
      <ButtonGroup style={{ minWidth: 200 }}>
        {Object.keys(GROUPS).map((id) => {
          return <Button
            key={id}
            disabled={this.state.id === id}
            onClick={() => this.onSelect(id)}>
            {tx(id)}
          </Button>
        })}
      </ButtonGroup>
      <div className='gallery'>
        {medias.map((raw) => {
          var message = MessageWrapper.convert(raw)
          var msg = message.msg
          return <div className='item'
            onClick={this.onClickMedia.bind(this, message)}
            key={message.id}>
            {Attachment.render({
              direction: msg.direction,
              attachment: msg.attachment,
              conversationType: 'direct'
            })}
          </div>
        })}
      </div>
    </div>
  }
}

Media.contextType = ScreenContext

module.exports = Media
