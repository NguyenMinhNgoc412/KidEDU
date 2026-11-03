import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";

type RequestWithId = { id?: string };
type Reply = { status: (status: number) => Reply; send: (body: unknown) => void };

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<RequestWithId>();
    const reply = host.switchToHttp().getResponse<Reply>();
    const status =
      error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const code =
      status === 400
        ? "VALIDATION_ERROR"
        : status === 401
          ? "UNAUTHENTICATED"
          : status === 403
            ? "FORBIDDEN"
            : status === 404
              ? "NOT_FOUND"
              : status === 409
                ? "CONFLICT"
                : status === 503
                  ? "SERVICE_UNAVAILABLE"
                  : "INTERNAL_ERROR";
    const message =
      status === 400
        ? "Dữ liệu không hợp lệ."
        : status === 401
          ? "Cần đăng nhập để tiếp tục."
          : status === 403
            ? "Bạn chưa có quyền thực hiện thao tác này."
            : status === 404
              ? "Không tìm thấy."
              : status === 409
                ? "Dữ liệu đã thay đổi. Vui lòng tải lại."
                : status === 503
                  ? "Dịch vụ tạm thời không khả dụng."
                  : "Đã xảy ra lỗi. Vui lòng thử lại.";
    reply
      .status(status)
      .send({ error: { code, message, requestId: request.id ?? "", fields: [] } });
  }
}
