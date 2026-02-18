export const EllipsisLoading = () => {
  return (
    <>
      {/* <div className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div> */}

      <div className="lds-ellipsis">
        <i className="fa fa-circle" />
        <i className="fa fa-circle" />
        <i className="fa fa-circle" />
        <i className="fa fa-circle" />
      </div>

      <style jsx>{`
        .lds-ellipsis {
          display: inline-block;
          position: relative;
          width: 80px;
          transform: scale(0.5, 0.5);
        }
        .lds-ellipsis i {
          position: absolute;
          margin-top: -11px;
          /* width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #fff; */
          animation-timing-function: cubic-bezier(0, 1, 1, 0);
        }
        .lds-ellipsis i:nth-child(1) {
          left: 8px;
          animation: lds-ellipsis1 0.6s infinite;
        }
        .lds-ellipsis i:nth-child(2) {
          left: 8px;
          animation: lds-ellipsis2 0.6s infinite;
        }
        .lds-ellipsis i:nth-child(3) {
          left: 32px;
          animation: lds-ellipsis2 0.6s infinite;
        }
        .lds-ellipsis i:nth-child(4) {
          left: 56px;
          animation: lds-ellipsis3 0.6s infinite;
        }

        /*
        .lds-ellipsis div {
          position: absolute;
          margin-top: -11px;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #fff;
          animation-timing-function: cubic-bezier(0, 1, 1, 0);
        }
        .lds-ellipsis div:nth-child(1) {
          left: 8px;
          animation: lds-ellipsis1 0.6s infinite;
        }
        .lds-ellipsis div:nth-child(2) {
          left: 8px;
          animation: lds-ellipsis2 0.6s infinite;
        }
        .lds-ellipsis div:nth-child(3) {
          left: 32px;
          animation: lds-ellipsis2 0.6s infinite;
        }
        .lds-ellipsis div:nth-child(4) {
          left: 56px;
          animation: lds-ellipsis3 0.6s infinite;
        }
        */

        @keyframes lds-ellipsis1 {
          0% {
            transform: scale(0);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes lds-ellipsis3 {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(0);
          }
        }
        @keyframes lds-ellipsis2 {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(24px, 0);
          }
        }
      `}</style>
    </>
  );
};
