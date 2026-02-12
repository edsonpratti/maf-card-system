import LoginForm from "@/components/login-form"

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4">
            <LoginForm admin />
        </div>
    )
}
