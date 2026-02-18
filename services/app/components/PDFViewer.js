import React, { Component } from "react";
import PDFObject from "pdfobject";
import { FormModal } from "./Modal";

class PDFViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: parseInt(Math.random() * 1000),
      pdfUrl: null,
      mounted: false,
    };
  }

  componentDidMount() {
    this.setState({
      mounted: true,
    });
  }

  componentDidUpdate() {
    const { pdfUrl } = this.props;
    // console.log("componentDidUpdate", { pdfUrl });
    if (pdfUrl && this.pdfUrl !== pdfUrl) {
      this.pdfUrl = pdfUrl;
      if (pdfUrl) {
        PDFObject.embed(pdfUrl, `#custom-pdf-viewer-${this.state.id}`);
      }
    }
  }

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.pdfUrl !== this.props.pdfUrl) {
      // setTimeout(() => {
      PDFObject.embed(nextProps.pdfUrl, `#custom-pdf-viewer-${this.state.id}`);
      // }, 500);
    }
  };

  render() {
    if (!this.state.mounted) return null;
    const { width, height } = this.props;
    return (
      <div
        style={{ width, height }}
        id={`custom-pdf-viewer-${this.state.id}`}
      />
    );
  }
}

export default PDFViewer;

export const PDFViewerModal = ({
  pdfUrl,
  width,
  height = 600,
  ...modalProps
}) => {
  return (
    <FormModal {...modalProps} closeLabel="Tutup" size="lg">
      {pdfUrl ? (
        <PDFViewer pdfUrl={pdfUrl} width={width} height={height} />
      ) : null}
    </FormModal>
  );
};
