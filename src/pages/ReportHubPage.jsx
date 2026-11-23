import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, PawPrint, ShieldCheck } from 'lucide-react';

export default function ReportHubPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 md:px-8 pt-8 md:pt-12 space-y-8">
      <div className="space-y-2 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-[#26352B]">O que aconteceu?</h1>
        <p className="text-base text-[#6B786D] leading-relaxed">
          Escolha o tipo de relato mais adequado. Quanto mais detalhes visuais e da região aproximada você informar, mais fácil fica identificar possíveis correspondências.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Link
          to="/reportar/perdido"
          className="group bg-white border border-[#E2E9E1] hover:border-[#52765A] rounded-2xl p-6 sm:p-7 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between gap-6"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF0ED] text-[#B04332] border border-[#F7D2CC] flex items-center justify-center">
              <PawPrint className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-semibold text-[#26352B]">
                Perdi um animal
              </h2>
              <p className="text-sm text-[#6B786D] leading-relaxed">
                Cadastre fotos, nome, porte, características marcantes e a região aproximada onde seu companheiro desapareceu.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#52765A] group-hover:translate-x-0.5 transition-transform">
            Criar relato de animal perdido
            <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        <Link
          to="/reportar/encontrado"
          className="group bg-white border border-[#E2E9E1] hover:border-[#52765A] rounded-2xl p-6 sm:p-7 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between gap-6"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF5EC] text-[#3E7B52] border border-[#CDE6D2] flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-semibold text-[#26352B]">
                Encontrei ou avistei um animal
              </h2>
              <p className="text-sm text-[#6B786D] leading-relaxed">
                Registre um animal acolhido ou avistado na vizinhança para ajudar o tutor responsável a localizá-lo rapidamente.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#52765A] group-hover:translate-x-0.5 transition-transform">
            Criar relato de animal encontrado
            <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>

      <div className="rounded-2xl bg-[#F3EEE4] border border-[#E7DDD0] p-5 flex items-start gap-3 text-sm text-[#26352B]">
        <ShieldCheck className="w-5 h-5 text-[#52765A] shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-[#6B786D] leading-relaxed">
          Seus contatos pessoais (e-mail, telefone ou endereço residencial) permanecem protegidos. Outros usuários só podem falar com você pelo chat seguro dentro do Reencontro.
        </p>
      </div>
    </div>
  );
}
