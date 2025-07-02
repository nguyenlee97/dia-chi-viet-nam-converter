import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Vietnamese translations
const resources = {
  vi: {
    translation: {
      // General UI
      "appTitle": "Công Cụ Chuyển Đổi Địa Chỉ Cũ",
      "appSubtitle": "Tra cứu đơn vị hành chính mới theo Nghị quyết số 202/2025/QH15",
      "streetInfoLabel": "Số nhà, Tên đường/phố/thôn/xóm",
      "streetInfoPlaceholder": "Nhập số nhà và tên đường...",
      "provinceLabel": "Chọn Tỉnh/Thành phố",
      "provincePlaceholder": "-- Chọn Tỉnh/Thành phố --",
      "districtLabel": "Chọn Quận/Huyện",
      "districtPlaceholder": "-- Chọn Quận/Huyện --",
      "wardLabel": "Chọn Phường/Xã",
      "wardPlaceholder": "-- Chọn Phường/Xã --",
      "submitButton": "Tra Cứu Địa Chỉ",
      "submittingButton": "Đang tra cứu...",
      "loadingData": "Đang tải dữ liệu địa chỉ...",
      "resetForm": "Làm mới",
      
      // Results
      "resultTitle": "Kết Quả Tra Cứu",
      "oldAddressLabel": "Địa chỉ cũ:",
      "newAddressLabel": "Địa chỉ mới:",
      "mergedResult": "Phường/Xã này đã được sáp nhập",
      "splittedResult": "Phường/Xã này đã được chia tách",
      "coordinatesUsed": "Tọa độ được sử dụng:",

      // Status messages
      "info_split_needs_coords": "Phường/Xã này đã được tách thành nhiều phường/xã mới. Chúng tôi cần định vị địa chỉ của bạn để tìm kết quả chính xác.",
      "geocoding_in_progress": "Đang tìm tọa độ cho địa chỉ của bạn...",
      "geocoding_success": "Đã tìm được tọa độ và xác định phường/xã mới",
      
      // Error Messages
      "ERROR_COOLDOWN": "Bạn thao tác quá nhanh. Vui lòng thử lại sau {{timeLeft}} giây.",
      "ERROR_RATE_LIMIT": "Bạn đã vượt quá số lần tra cứu cho phép (20 lần/giờ). Vui lòng thử lại lúc {{resetTime}}.",
      "ERROR_METHOD_NOT_ALLOWED": "Phương thức không hợp lệ.",
      "ERROR_MISSING_ADDRESS": "Vui lòng chọn đầy đủ Tỉnh, Huyện và Phường.",
      "ERROR_NOT_FOUND": "Không tìm thấy địa chỉ cũ trong dữ liệu của chúng tôi.",
      "ERROR_SPLIT_NO_MATCH": "Không thể xác định vị trí của bạn trong bất kỳ phường/xã mới nào. Địa chỉ có thể nằm ở khu vực ranh giới.",
      "ERROR_SERVER_GEO": "Lỗi xử lý dữ liệu không gian trên máy chủ.",
      "ERROR_GEOCODING_FAILED": "Không thể tự động tìm thấy tọa độ cho địa chỉ của bạn. Vui lòng kiểm tra lại thông tin số nhà, tên đường.",
      "ERROR_NETWORK": "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.",
      "ERROR_UNKNOWN": "Đã có lỗi không xác định xảy ra. Vui lòng thử lại.",
      
      // Footer
      "footerText": "Dữ liệu dựa trên Nghị quyết số 202/2025/QH15 của Ủy ban Thường vụ Quốc hội",
      "lastUpdated": "Cập nhật lần cuối:"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;