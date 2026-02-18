const MINIMUM_FEE = 500;
const TAX_RATE = 0.18;
const ROUND = 200;

const MaintenanceMessage = () => {
  return (
    <span>
      <i className="fa fa-exclamation-circle opacity-50" /> Under maintenance
    </span>
  );
};

const renderVirtualAccountAdditionalInfo = (props) => {
  if (props.bill && props.bill.amount < props.paymentMethod.minAmount) {
    return (
      <span>
        <i className="fa fa-exclamation-circle" /> Minimal pembayaran untuk
        Virtual Account adalah Rp{props.paymentMethod.minAmount}
      </span>
    );
  }
  if (
    props.bill &&
    props.paymentMethod.maxAmount &&
    props.bill.amount > props.paymentMethod.maxAmount
  ) {
    return (
      <span>
        <i className="fa fa-exclamation-circle" /> Maksimal tagihan untuk
        Virtual Account adalah Rp{props.paymentMethod.maxAmount}
      </span>
    );
  }
  return "";
};

const EWALLET_PAYMENT_METHODS = [
  // {
  //   _id: "GOPAY",
  //   name: "GOPAY",
  //   logoUrl: "/images/fund/gopay.png",
  //   minAmount: 1500,
  //   maxAmount: 2 * 1000 * 1000,
  //   feeRate: 2.0,
  //   provider: "XENDIT", // or MIDTRANS, FASPAY, XENDIT
  // },
  {
    _id: "SHOPEEPAY",
    name: "Shopee Pay",
    logoUrl: "/images/fund/shopeepay.png",
    minAmount: 1500,
    maxAmount: 2 * 1000 * 1000,
    feeRate: 1.5,
    provider: "XENDIT", // or MIDTRANS, FASPAY, XENDIT
    //
    isDisabled: (props) => {
      if (
        props.router &&
        props.router.query &&
        props.router.query.ggmode === "true"
      ) {
        return false;
      }
      const unavailableByMismatchAmount = !isPaymentMethodAvailable({
        paymentMethod: props.paymentMethod,
        amount: props.bill.amount,
      });

      // console.log(props.browserInfo);
      let isMobile = true;
      if (props.browserInfo) {
        if (
          props.browserInfo.platform &&
          props.browserInfo.platform.type !== "mobile"
        ) {
          isMobile = false;
          // console.log(
          //   "!isMobile => props.browserInfo.platform",
          //   props.browserInfo.platform.type
          // );
        } else if (
          props.browserInfo.window &&
          props.browserInfo.window.innerHeight <
            props.browserInfo.window.innerWidth
        ) {
          isMobile = false;
          // console.log(
          //   "!isMobile => props.browserInfo.window",
          //   props.browserInfo.window.innerHeight,
          //   props.browserInfo.window.innerWidth
          // );
        }
      }

      // console.log({
      //   unavailableByMismatchAmount,
      //   isMobile,
      // });
      return unavailableByMismatchAmount || !isMobile;
    },
    renderAdditionalInfo: (props) => {
      let isMobile = true;
      if (props.browserInfo) {
        if (
          props.browserInfo.platform &&
          props.browserInfo.platform.type !== "mobile"
        ) {
          isMobile = false;
          // console.log(
          //   "!isMobile => props.browserInfo.platform",
          //   props.browserInfo.platform.type
          // );
        } else if (
          props.browserInfo.window &&
          props.browserInfo.window.innerHeight <
            props.browserInfo.window.innerWidth
        ) {
          isMobile = false;
          // console.log(
          //   "!isMobile => props.browserInfo.window",
          //   props.browserInfo.window.innerHeight,
          //   props.browserInfo.window.innerWidth
          // );
        }
      }

      if (!isMobile) {
        return (
          <span className="text-red-400">
            <i className="fa fa-exclamation-triangle" /> Hanya berlaku untuk
            pembayaran melalui mobile browser atau mobile app!
          </span>
        );
      }

      return (
        <span>
          <i className="fas fa-star opacity-50" /> Tukarkan 50% koin, dan
          dapatkan cashback 30% hingga Rp5.000!
        </span>
      );
    },
  },
  {
    _id: "OVO",
    name: "OVO",
    logoUrl: "/images/fund/ovo.png",
    minAmount: 1500,
    maxAmount: 2 * 1000 * 1000,
    feeRate: 1.5,
    provider: "XENDIT", // or MIDTRANS, FASPAY, XENDIT
    renderAdditionalInfo: (props) => {
      return (
        <span>
          <i className="fas fa-star opacity-50" /> Berlaku OVO point hingga 50%!
        </span>
      );
    },
  },
  {
    _id: "QRIS",
    name: "QRIS",
    logoUrl: "/images/fund/qris.png",
    minAmount: 1500,
    maxAmount: 2 * 1000 * 1000,
    feeRate: 0.7,
    provider: "XENDIT", // or MIDTRANS, FASPAY, XENDIT
    renderAdditionalInfo: (props) => {
      let isMobile = true;
      if (props.browserInfo) {
        if (
          props.browserInfo.platform &&
          props.browserInfo.platform.type !== "mobile"
        ) {
          isMobile = false;
          // console.log(
          //   "!isMobile => props.browserInfo.platform",
          //   props.browserInfo.platform.type
          // );
        } else if (
          props.browserInfo.window &&
          props.browserInfo.window.innerHeight <
            props.browserInfo.window.innerWidth
        ) {
          isMobile = false;
          // console.log(
          //   "!isMobile => props.browserInfo.window",
          //   props.browserInfo.window.innerHeight,
          //   props.browserInfo.window.innerWidth
          // );
        }
      }
      if (isMobile) return "";
      return (
        <span>
          <i className="fa fa-info-circle opacity-50" /> Gunakan QRIS untuk
          menghemat biaya, paling terjangkau, hanya 0.7%.
        </span>
      );
    },
  },
  {
    _id: "DANA",
    name: "DANA",
    logoUrl: "/images/fund/dana.png",
    minAmount: 1500,
    maxAmount: 2 * 1000 * 1000,
    feeRate: 1.5,
    provider: "XENDIT", // or MIDTRANS, FASPAY, XENDIT
  },
  {
    _id: "LINKAJA",
    name: "Link Aja",
    logoUrl: "/images/fund/linkaja.png",
    minAmount: 1500,
    maxAmount: 2 * 1000 * 1000,
    feeRate: 1.5,
    provider: "XENDIT", // or MIDTRANS, FASPAY, XENDIT
  },
];

const VIRTUAL_ACCOUNT_METHODS = [
  {
    _id: "VA_BCA",
    name: "BCA",
    logoUrl: "/images/fund/bca.png",
    minAmount: 10 * 1000,
    maxAmount: 50 * 1000 * 1000,
    feeRate: 4000,
    provider: "FASPAY", // or XENDIT, MIDTRANS
    isDisabled: (props) => {
      const unavailableByMismatchAmount = !isPaymentMethodAvailable({
        paymentMethod: props.paymentMethod,
        amount: props.bill.amount,
      });
      return unavailableByMismatchAmount;
    },
    renderAdditionalInfo: renderVirtualAccountAdditionalInfo,
    // isHidden: (props) => {
    //   return !props.router || props.router.query.ggmode !== "true";
    // },
  },
  {
    _id: "VA_MANDIRI",
    name: "Mandiri",
    logoUrl: "/images/fund/mandiri.png",
    minAmount: 10 * 1000,
    maxAmount: 50 * 1000 * 1000,
    feeRate: 4500,
    provider: "XENDIT", // or MIDTRANS, FASPAY, XENDIT
    isDisabled: (props) => {
      const unavailableByMismatchAmount = !isPaymentMethodAvailable({
        paymentMethod: props.paymentMethod,
        amount: props.bill.amount,
      });
      return unavailableByMismatchAmount;
    },
    renderAdditionalInfo: renderVirtualAccountAdditionalInfo,
  },
  {
    _id: "VA_BRI",
    name: "BRI",
    logoUrl: "/images/fund/bri.png",
    minAmount: 10 * 1000,
    maxAmount: 50 * 1000 * 1000,
    feeRate: 4500,
    provider: "XENDIT", // or MIDTRANS, FASPAY, XENDIT
    isDisabled: (props) => {
      const unavailableByMismatchAmount = !isPaymentMethodAvailable({
        paymentMethod: props.paymentMethod,
        amount: props.bill.amount,
      });
      return unavailableByMismatchAmount;
    },
    renderAdditionalInfo: renderVirtualAccountAdditionalInfo,
  },
  {
    _id: "VA_BNI",
    name: "BNI",
    logoUrl: "/images/fund/bni.png",
    minAmount: 10 * 1000,
    maxAmount: 50 * 1000 * 1000,
    feeRate: 4500,
    provider: "XENDIT", // or MIDTRANS, FASPAY, XENDIT
    isDisabled: (props) => {
      const unavailableByMismatchAmount = !isPaymentMethodAvailable({
        paymentMethod: props.paymentMethod,
        amount: props.bill.amount,
      });
      return unavailableByMismatchAmount;
    },
    renderAdditionalInfo: renderVirtualAccountAdditionalInfo,
  },
];

const calculateFinalFee = ({ paymentMethod, amount }) => {
  if (amount < paymentMethod.minAmount) {
    console.warn(
      `Nilai tagihan untuk metode pembayaran ${paymentMethod.name} harus lebih tinggi atau sama dengan Rp${paymentMethod.minAmount}!`
    );
    return 0;
  }
  if (paymentMethod.maxAmount && amount >= paymentMethod.maxAmount) {
    console.warn(
      `Nilai tagihan untuk metode pembayaran ${paymentMethod.name} harus lebih rendah atau sama dengan Rp${paymentMethod.maxAmount}!`
    );
    return 0;
  }

  const paymentMethodRate = paymentMethod.feeRate;
  let temporaryFinalAmount = 0;
  if (paymentMethodRate <= 100) {
    const finalRate = paymentMethodRate + paymentMethodRate * TAX_RATE;
    temporaryFinalAmount = (100.0 * amount) / (100.0 - finalRate);
  } else {
    let taxRate = paymentMethodRate * TAX_RATE;
    temporaryFinalAmount = amount + paymentMethodRate + taxRate;
    // console.log({
    //   amount,
    //   paymentMethodRate,
    //   taxRate,
    //   temporaryFinalAmount,
    // });
  }
  let fee = temporaryFinalAmount - amount;
  // let fee = (amount * finalRate) / 100.0;
  let modResult = fee % ROUND;
  if (modResult > 0) {
    fee = Math.floor(fee / ROUND) * ROUND + ROUND;
  }
  // console.log(
  //   "fee",
  //   temporaryFinalAmount - amount,
  //   fee,
  //   modResult,
  //   Math.floor(fee / 100)
  // );
  if (fee < MINIMUM_FEE) {
    fee = MINIMUM_FEE;
  }
  // console.log("fee < MINIMUM_FEE", fee, MINIMUM_FEE);

  // const simulatedFinalAmount = amount + fee;
  // const simulatedFinalFee = (simulatedFinalAmount * finalRate) / 100.0;
  // const simulatedFinalRate = ((simulatedFinalAmount - amount) * 100.0) / amount;

  // console.log({
  //   paymentMethod,
  //   paymentMethodRate,
  //   temporaryFinalAmount,
  //   finalRate,
  //   fee,
  //   simulatedFinalFee,
  //   simulatedFinalRate,
  // });

  return fee;
};

const isPaymentMethodAvailable = ({ paymentMethod, amount }) => {
  if (paymentMethod.disabled) {
    return false;
  }
  if (amount < paymentMethod.minAmount) {
    return false;
  }
  if (paymentMethod.maxAmount && amount > paymentMethod.maxAmount) {
    return false;
  }
  return true;
};

const FAILURES_CODES = {
  USER_DID_NOT_AUTHORIZE_THE_PAYMENT:
    "Pengguna tidak melakukan autorisasi pembayaran dalam kurun waktu yang ditentukan",
  USER_DECLINED_THE_TRANSACTION: "Pengguna menolak request pembayaran",
  PHONE_NUMBER_NOT_REGISTERED: "Nomor handphone tidak terdaftar",
  EWALLET_APP_UNREACHABLE:
    "eWallet provide/server tidak dapat dijangkau oleh aplikasi ewallet/handphone pengguna. Kasus umum yang terjadi adalah karena aplikasi ewallet di-uninstalled/isu pada jaringan.",
  OVO_TIMEOUT_ERROR:
    "Terdapat timeout connection dari aplikasi OVO ke server OVO",
  CREDENTIALS_ERROR: "Merchant tidak terdaftar di sistem penyedia eWallet",
  ACCOUNT_AUTHENTICATION_ERROR: "Autentikasi user gagal",
  ACCOUNT_BLOCKED_ERROR:
    "Tidak dapat memproses transaksi karena akun pengguna diblok",
  SENDING_TRANSACTION_ERROR:
    "Eror ketika mengirimkan notifikasi transaksi ke OVO",
  EXTERNAL_ERROR: "Terdapat eror pada sisi penyedia eWallet",
  EXPIRED: "Waktu Pembayaran Habis",
  // new since 8 April 2021
  ACCOUNT_ACCESS_BLOCKED:
    "End user’s account cannot be accessed as it has been restricted by the eWallet provider. End user should contact the provider for resolution.",
  INVALID_MERCHANT_CREDENTIALS:
    "Merchant credentials met with an error with the eWallet provider. Please contact Xendit customer support to resolve this issue.",
  USER_DECLINED_PAYMENT: "End user declined the payment request.",
  INVALID_ACCOUNT_DETAILS:
    "End user provided incorrect information for this transaction.",
  MAXIMUM_LIMIT_REACHED:
    "Accumulated value of payment requested for this end user went above the maximum transaction limit set by end user or eWallets. Payment can be retried when the transaction limit is reset.",
  USER_UNREACHABLE:
    "End user’s device cannot be reached at this moment. Common reasons include unstable network, device error or jailbroken device.",
  CHANNEL_UNAVAILABLE:
    "The payment channel requested is currently experiencing unexpected issues. The eWallet provider will be notified to resolve this issue.",
  INSUFFICIENT_BALANCE:
    "End user has insufficient balance to complete the transaction.",
  ACCOUNT_NOT_ACTIVATED:
    "End user’s account cannot be accessed as it has not been activated. End user should set up their account and ensure there is sufficient balance before retrying.",
  INVALID_TOKEN:
    "Binding for this end user has expired. Please reinitiate binding before retrying.",
};

module.exports = {
  MINIMUM_FEE,
  TAX_RATE,
  EWALLET_PAYMENT_METHODS,
  VIRTUAL_ACCOUNT_METHODS,
  ALL_PAYMENT_METHODS: [...EWALLET_PAYMENT_METHODS, ...VIRTUAL_ACCOUNT_METHODS],
  calculateFinalFee,
  isPaymentMethodAvailable,
  FAILURES_CODES,
};
