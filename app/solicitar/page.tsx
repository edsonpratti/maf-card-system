import SolicitationForm from "@/components/solicitation-form"

export default function SolicitarPage() {
    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-6 text-center">Faça sua Solicitação</h1>
            <SolicitationForm />
        </div>
    )
}
