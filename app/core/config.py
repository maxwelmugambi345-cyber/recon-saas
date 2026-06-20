from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MPESA_CONSUMER_KEY: str = "your_consumer_key"
    MPESA_CONSUMER_SECRET: str = "your_consumer_secret"
    MPESA_SHORTCODE: str = "174379"
    MPESA_PASSKEY: str = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
    MPESA_BASE_URL: str = "https://sandbox.safaricom.co.ke"
    CALLBACK_BASE_URL: str = "https://your-ngrok-url.ngrok.io"
    RESEND_API_KEY: str = ""
    SECRET_KEY: str = "change-this-to-a-very-long-random-secret-key"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
