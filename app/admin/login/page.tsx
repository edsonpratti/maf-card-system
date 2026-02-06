import LoginForm from "@/components/login-form"

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center px-4">
            <div className="mx-auto w-full max-w-sm mb-4 text-center">
                <h1 className="text-2xl font-bold">Área Administrativa</h1>
            </div>
            <LoginForm admin />
        </div>
    )
}
