// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Vietnamese translations
const resources = {
  vi: {
    translation: {
      // General UI
      "appTitle": "Công Cụ Tra Cứu Địa Giới Hành Chính Mới",
      "appSubtitle": "Dữ liệu cập nhật theo các nghị quyết về sắp xếp đơn vị hành chính cấp huyện, cấp xã.",
      "addressInputTitle": "Nhập địa chỉ cũ",
      "addressInputDescription": "Điền thông tin địa chỉ cũ để tìm đơn vị hành chính mới tương ứng.",
      "streetInfoLabel": "Số nhà, Tên đường/phố/thôn/xóm",
      "streetInfoPlaceholder": "VD: 123 đường Nguyễn Huệ",
      "provinceLabel": "Tỉnh/Thành phố",
      "provincePlaceholder": "Chọn Tỉnh/Thành",
      "districtLabel": "Quận/Huyện",
      "districtPlaceholder": "Chọn Quận/Huyện",
      "wardLabel": "Phường/Xã",
      "wardPlaceholder": "Chọn Phường/Xã",
      "submitButton": "Tra Cứu",
      "submittingButton": "Đang tra cứu...",
      "loadingData": "Đang tải dữ liệu...",
      "resetForm": "Nhập lại",
      
      // Results
      "resultTitle": "Kết Quả Tra Cứu",
      "oldAddressLabel": "Địa chỉ cũ",
      "newAddressLabel": "Địa chỉ mới",
      "mergedResult": "Sáp nhập",
      "splittedResult": "Chia tách",
      "coordinatesUsed": "Toạ độ đã dùng (kinh độ, vĩ độ):",

      // Status messages
      "info_split_needs_coords": "Phường/Xã này đã được chia tách. Vui lòng nhập Số nhà, Tên đường để hệ thống tự động định vị.",
      "geocoding_in_progress": "Đang tìm tọa độ cho địa chỉ của bạn...",
      "geocoding_success": "Đã định vị thành công",
      
      // Error Messages
      "ERROR_COOLDOWN": "Bạn thao tác quá nhanh. Vui lòng thử lại sau {{meta.timeLeft}} giây.",
      "ERROR_RATE_LIMIT": "Bạn đã vượt quá số lần tra cứu cho phép (20 lần/giờ). Vui lòng thử lại sau lúc {{meta.resetTime}}.",
      "ERROR_METHOD_NOT_ALLOWED": "Phương thức không hợp lệ.",
      "ERROR_MISSING_ADDRESS": "Vui lòng chọn đầy đủ Tỉnh, Huyện và Phường/Xã.",
      "ERROR_NOT_FOUND": "Không tìm thấy địa chỉ cũ trong cơ sở dữ liệu.",
      "ERROR_SPLIT_NO_MATCH": "Không thể xác định vị trí của bạn trong bất kỳ phường/xã mới nào. Địa chỉ có thể nằm ở khu vực ranh giới hoặc thông tin chưa chính xác.",
      "ERROR_SERVER_GEO": "Lỗi xử lý dữ liệu không gian trên máy chủ.",
      "ERROR_GEOCODING_FAILED": "Không thể tự động tìm tọa độ. Vui lòng kiểm tra lại thông tin Số nhà, Tên đường.",
      "ERROR_STREET_INFO_NEEDED": "Phường/Xã này đã bị chia tách. Bạn phải cung cấp Số nhà, Tên đường để tìm địa chỉ mới.",
      "ERROR_NETWORK": "Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet của bạn.",
      "ERROR_UNKNOWN": "Đã có lỗi không xác định xảy ra. Vui lòng thử lại sau.",
      
      // Footer
      "footerText": "Một sản phẩm phi lợi nhuận vì cộng đồng.",
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
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;