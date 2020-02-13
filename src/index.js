import React from "react"
import ReactDOM from "react-dom"

import * as cocoSsd from "@tensorflow-models/coco-ssd"
import "@tensorflow/tfjs"
import "./styles.css"

class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();

  state = {
    pictureB64: false
  }

  componentDidMount() {
    navigator.permissions.query({name: 'camera'})
    .then((permissionObj) => {
        
    })

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "environment"
          }
        })
        .then(stream => {
          window.stream = stream;
          this.videoRef.current.srcObject = stream;

          return new Promise((resolve, reject) => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        });
      const modelPromise = cocoSsd.load();
      Promise.all([modelPromise, webCamPromise])
        .then(values => {
          this.detectFrame(this.videoRef.current, values[0]);
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  detectFrame = (video, model) => {
    model.detect(video).then(predictions => {
      this.renderPredictions(predictions);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
    });
  };

  renderPredictions = predictions => {
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";
    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      const width = prediction.bbox[2];
      const height = prediction.bbox[3];
      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);
      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(prediction.class).width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
    });

    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.class, x, y);
    });

    if(predictions.filter(e => (e.class === "bottle" && e.score >= .5)).length >= 1){
      this.takePicture()
    }

    if(predictions.filter(e => (e.class === "person" && e.score >= .6)).length >= 2){
      this.takePicture()
    }
  };

  takePicture = (top = 0, left = 0, width = 0, height = 0) => {
    if(top > 0 && width > 0){
      let canvas = document.createElement("canvas")
      canvas.setAttribute("width", width)
      canvas.setAttribute("height", height)
      let context = canvas.getContext("2d")
      context.drawImage(this.videoRef.current, 0, 0, width, height, 0, 0, width, height)
      this.setState({pictureB64: canvas.toDataURL('image/jpeg', 0.7)})
    } else {
      let context = this.canvasRef.current.getContext("2d")
              
      context.drawImage(this.videoRef.current, 0, 0, window.innerWidth, window.innerHeight)

      this.setState({pictureB64: this.canvasRef.current.toDataURL('image/jpeg', 0.7)})
    }
  }

  render() {
    return (
      <div>
        <video
          className="camera"
          autoPlay
          playsInline
          muted
          ref={this.videoRef}
          width={window.innerWidth}
          height={window.innerHeight}
        />
        <canvas
        className="canvas"
        ref={this.canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onDoubleClick={this.takePicture}
        />
        {this.state.pictureB64 && 
            <img src={this.state.pictureB64} className="taked" alt="TAKED" />
        }
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
