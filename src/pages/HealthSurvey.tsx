import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Heart, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Secciones del cuestionario de salud
const sections = [
  {
    id: "demographics",
    title: "Información General",
    description: "Cuéntanos un poco sobre ti",
  },
  {
    id: "health_conditions",
    title: "Estado de Salud",
    description: "¿Tienes alguno de los siguientes padecimientos?",
  },
  {
    id: "physical_activity",
    title: "Actividad Física",
    description: "Háblanos sobre tu rutina de ejercicio",
  },
  {
    id: "nutrition",
    title: "Nutrición e Hidratación",
    description: "Tus hábitos alimenticios",
  },
  {
    id: "rest",
    title: "Descanso y Sueño",
    description: "Tu calidad de descanso",
  },
  {
    id: "work_environment",
    title: "Ambiente Laboral",
    description: "Condiciones de tu espacio de trabajo",
  },
];

const healthConditionOptions = [
  { id: "obesity", label: "Obesidad" },
  { id: "diabetes", label: "Diabetes" },
  { id: "metabolic", label: "Enfermedades metabólicas" },
  { id: "depression", label: "Depresión" },
  { id: "stress", label: "Estrés" },
  { id: "cardiovascular", label: "Enfermedades cardiovasculares" },
  { id: "arthritis", label: "Artritis" },
  { id: "none", label: "Ninguna" },
];

const physicalActivityOptions = [
  { value: "daily", label: "Todos los días" },
  { value: "3_times_week", label: "3 veces a la semana" },
  { value: "1_time_week", label: "1 vez a la semana" },
  { value: "never", label: "No realizo actividad física" },
];

const mealsPerDayOptions = [
  { value: "1", label: "1 vez al día" },
  { value: "2", label: "2 veces al día" },
  { value: "3", label: "3 veces al día" },
  { value: "more_than_3", label: "Más de 3 veces al día" },
];

const foodTypeOptions = [
  { id: "cereals", label: "Cereales (arroz, maíz, trigo)" },
  { id: "dairy", label: "Leche y derivados" },
  { id: "fruits", label: "Frutas" },
  { id: "vegetables", label: "Verduras" },
  { id: "meat", label: "Carne y embutidos" },
  { id: "fish", label: "Pescados y mariscos" },
  { id: "carbs", label: "Carbohidratos (alimentos azucarados)" },
  { id: "fats", label: "Grasas (alimentos fritos o de mucha grasa)" },
];

const waterIntakeOptions = [
  { value: "less_than_1L", label: "Menos de 1 litro" },
  { value: "1_2L", label: "1-2 litros" },
  { value: "2_3L", label: "2-3 litros" },
  { value: "more_than_3L", label: "Más de 3 litros" },
];

const caffeineOptions = [
  { value: "none", label: "No consumo cafeína" },
  { value: "1_2_cups", label: "1-2 tazas al día" },
  { value: "3_4_cups", label: "3-4 tazas al día" },
  { value: "more_than_4", label: "Más de 4 tazas al día" },
];

const sleepHoursOptions = [
  { value: "less_than_5", label: "Menos de 5 horas" },
  { value: "5_6", label: "5-6 horas" },
  { value: "7_8", label: "7-8 horas" },
  { value: "more_than_8", label: "Más de 8 horas" },
];

const sleepQualityOptions = [
  { value: "very_bad", label: "Muy mala" },
  { value: "bad", label: "Mala" },
  { value: "regular", label: "Regular" },
  { value: "good", label: "Buena" },
  { value: "very_good", label: "Muy buena" },
];

const workDisconnectionOptions = [
  { value: "never", label: "Nunca puedo desconectarme" },
  { value: "rarely", label: "Rara vez" },
  { value: "sometimes", label: "A veces" },
  { value: "usually", label: "Usualmente" },
  { value: "always", label: "Siempre logro desconectarme" },
];

const dailyFatigueOptions = [
  { value: "never", label: "Nunca" },
  { value: "rarely", label: "Rara vez" },
  { value: "sometimes", label: "A veces" },
  { value: "often", label: "Frecuentemente" },
  { value: "always", label: "Siempre" },
];

const medicalCheckupOptions = [
  { value: "more_than_5", label: "Más de 5 veces al año" },
  { value: "3_times", label: "3 veces al año" },
  { value: "2_times", label: "2 veces al año" },
  { value: "1_time", label: "1 vez al año" },
  { value: "never", label: "No me realizo chequeos médicos regulares" },
];

const sedentaryHoursOptions = [
  { value: "less_than_4", label: "Menos de 4 horas" },
  { value: "4_6", label: "4-6 horas" },
  { value: "6_8", label: "6-8 horas" },
  { value: "more_than_8", label: "Más de 8 horas" },
];

const ergonomicSetupOptions = [
  { value: "very_bad", label: "Muy malo - No tengo equipamiento adecuado" },
  { value: "bad", label: "Malo - Equipamiento básico sin ajustes" },
  { value: "regular", label: "Regular - Algunos elementos ergonómicos" },
  { value: "good", label: "Bueno - Puesto bien equipado" },
  { value: "very_good", label: "Muy bueno - Totalmente ergonómico" },
];

const screenExposureOptions = [
  { value: "less_than_4", label: "Menos de 4 horas" },
  { value: "4_6", label: "4-6 horas" },
  { value: "6_8", label: "6-8 horas" },
  { value: "8_10", label: "8-10 horas" },
  { value: "more_than_10", label: "Más de 10 horas" },
];

const genderOptions = [
  { value: "female", label: "Mujer" },
  { value: "male", label: "Hombre" },
  { value: "prefer_not_say", label: "Prefiero no decirlo" },
];

interface SurveyResponses {
  gender: string;
  age: string;
  healthConditions: string[];
  physicalActivity: string;
  sedentaryHours: string;
  activeBreaks: boolean;
  mealsPerDay: string;
  foodTypes: string[];
  waterIntake: string;
  caffeineConsumption: string;
  sleepHours: string;
  sleepQuality: string;
  workDisconnection: string;
  dailyFatigue: string;
  medicalCheckup: string;
  ergonomicSetup: string;
  screenExposure: string;
}

const HealthSurvey = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [responses, setResponses] = useState<SurveyResponses>({
    gender: "",
    age: "",
    healthConditions: [],
    physicalActivity: "",
    sedentaryHours: "",
    activeBreaks: false,
    mealsPerDay: "",
    foodTypes: [],
    waterIntake: "",
    caffeineConsumption: "",
    sleepHours: "",
    sleepQuality: "",
    workDisconnection: "",
    dailyFatigue: "",
    medicalCheckup: "",
    ergonomicSetup: "",
    screenExposure: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(false);
  };

  const progress = ((currentSection + 1) / sections.length) * 100;

  const handleRadioChange = (field: keyof SurveyResponses, value: string) => {
    setResponses({ ...responses, [field]: value });
  };

  const handleCheckboxChange = (field: "healthConditions" | "foodTypes", value: string, checked: boolean) => {
    const current = responses[field] as string[];
    if (value === "none" && checked) {
      setResponses({ ...responses, [field]: ["none"] });
    } else if (checked) {
      setResponses({ ...responses, [field]: [...current.filter(v => v !== "none"), value] });
    } else {
      setResponses({ ...responses, [field]: current.filter(v => v !== value) });
    }
  };

  const validateSection = (): boolean => {
    const section = sections[currentSection];
    
    switch (section.id) {
      case "demographics":
        if (!responses.gender || !responses.age) {
          toast.error("Por favor completa todos los campos");
          return false;
        }
        const age = parseInt(responses.age);
        if (isNaN(age) || age < 18 || age > 100) {
          toast.error("La edad debe estar entre 18 y 100 años");
          return false;
        }
        return true;
      
      case "health_conditions":
        if (responses.healthConditions.length === 0) {
          toast.error("Por favor selecciona al menos una opción");
          return false;
        }
        return true;
      
      case "physical_activity":
        if (!responses.physicalActivity || !responses.sedentaryHours) {
          toast.error("Por favor completa todos los campos");
          return false;
        }
        return true;
      
      case "nutrition":
        if (!responses.mealsPerDay || responses.foodTypes.length === 0 || !responses.waterIntake || !responses.caffeineConsumption) {
          toast.error("Por favor completa todos los campos");
          return false;
        }
        return true;
      
      case "rest":
        if (!responses.sleepHours || !responses.sleepQuality || !responses.workDisconnection || !responses.dailyFatigue) {
          toast.error("Por favor completa todos los campos");
          return false;
        }
        return true;
      
      case "work_environment":
        if (!responses.medicalCheckup || !responses.ergonomicSetup || !responses.screenExposure) {
          toast.error("Por favor completa todos los campos");
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateSection()) {
      if (currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const calculateScores = () => {
    let physicalScore = 0;
    let nutritionScore = 0;
    let restScore = 0;

    // Physical activity score (0-100)
    switch (responses.physicalActivity) {
      case "daily": physicalScore += 40; break;
      case "3_times_week": physicalScore += 30; break;
      case "1_time_week": physicalScore += 15; break;
      default: physicalScore += 0;
    }

    switch (responses.sedentaryHours) {
      case "less_than_4": physicalScore += 30; break;
      case "4_6": physicalScore += 20; break;
      case "6_8": physicalScore += 10; break;
      default: physicalScore += 0;
    }

    if (responses.activeBreaks) physicalScore += 15;

    switch (responses.ergonomicSetup) {
      case "very_good": physicalScore += 15; break;
      case "good": physicalScore += 12; break;
      case "regular": physicalScore += 8; break;
      case "bad": physicalScore += 4; break;
      default: physicalScore += 0;
    }

    // Nutrition score (0-100)
    switch (responses.mealsPerDay) {
      case "3": nutritionScore += 30; break;
      case "more_than_3": nutritionScore += 25; break;
      case "2": nutritionScore += 15; break;
      default: nutritionScore += 5;
    }

    const healthyFoods = ["cereals", "dairy", "fruits", "vegetables", "fish"];
    const unhealthyFoods = ["carbs", "fats"];
    const healthyCount = responses.foodTypes.filter(f => healthyFoods.includes(f)).length;
    const unhealthyCount = responses.foodTypes.filter(f => unhealthyFoods.includes(f)).length;
    nutritionScore += Math.min(healthyCount * 8, 40);
    nutritionScore -= unhealthyCount * 5;

    switch (responses.waterIntake) {
      case "more_than_3L": nutritionScore += 20; break;
      case "2_3L": nutritionScore += 15; break;
      case "1_2L": nutritionScore += 10; break;
      default: nutritionScore += 5;
    }

    switch (responses.caffeineConsumption) {
      case "none": nutritionScore += 10; break;
      case "1_2_cups": nutritionScore += 8; break;
      case "3_4_cups": nutritionScore += 4; break;
      default: nutritionScore += 0;
    }

    // Rest score (0-100)
    switch (responses.sleepHours) {
      case "7_8": restScore += 30; break;
      case "more_than_8": restScore += 25; break;
      case "5_6": restScore += 15; break;
      default: restScore += 5;
    }

    switch (responses.sleepQuality) {
      case "very_good": restScore += 25; break;
      case "good": restScore += 20; break;
      case "regular": restScore += 12; break;
      case "bad": restScore += 5; break;
      default: restScore += 0;
    }

    switch (responses.workDisconnection) {
      case "always": restScore += 20; break;
      case "usually": restScore += 15; break;
      case "sometimes": restScore += 10; break;
      case "rarely": restScore += 5; break;
      default: restScore += 0;
    }

    switch (responses.dailyFatigue) {
      case "never": restScore += 25; break;
      case "rarely": restScore += 20; break;
      case "sometimes": restScore += 12; break;
      case "often": restScore += 5; break;
      default: restScore += 0;
    }

    // Normalize scores
    physicalScore = Math.max(0, Math.min(100, physicalScore));
    nutritionScore = Math.max(0, Math.min(100, nutritionScore));
    restScore = Math.max(0, Math.min(100, restScore));

    const overallScore = Math.round((physicalScore + nutritionScore + restScore) / 3);

    let riskLevel = "bajo";
    if (overallScore < 40) riskLevel = "alto";
    else if (overallScore < 60) riskLevel = "medio";

    return { physicalScore, nutritionScore, restScore, overallScore, riskLevel };
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión para enviar la encuesta");
        navigate("/auth");
        return;
      }

      const scores = calculateScores();

      const { data: surveyData, error } = await (supabase.from("health_surveys") as any).insert({
        user_id: user.id,
        gender: responses.gender,
        age: parseInt(responses.age),
        health_conditions: responses.healthConditions,
        physical_activity_frequency: responses.physicalActivity,
        sedentary_hours: parseInt(responses.sedentaryHours.replace(/\D/g, "")) || 0,
        active_breaks: responses.activeBreaks,
        meals_per_day: parseInt(responses.mealsPerDay) || 3,
        food_types: responses.foodTypes,
        water_intake: responses.waterIntake,
        caffeine_consumption: responses.caffeineConsumption,
        sleep_hours: parseInt(responses.sleepHours.replace(/\D/g, "")) || 7,
        sleep_quality: responses.sleepQuality,
        work_disconnection: responses.workDisconnection,
        daily_fatigue: responses.dailyFatigue,
        medical_checkup_frequency: responses.medicalCheckup,
        ergonomic_setup: responses.ergonomicSetup,
        screen_exposure_hours: parseInt(responses.screenExposure.replace(/\D/g, "")) || 8,
        responses: responses,
        physical_health_score: scores.physicalScore,
        nutrition_score: scores.nutritionScore,
        rest_score: scores.restScore,
        overall_health_score: scores.overallScore,
        risk_level: scores.riskLevel,
      }).select().single();

      if (error) {
        toast.error("Error al guardar la encuesta: " + error.message);
        return;
      }

      toast.success("¡Encuesta completada! Generando tus recomendaciones...");

      // Generate recommendations
      const { error: recError } = await supabase.functions.invoke("generate-health-recommendations", {
        body: {
          surveyId: surveyData.id,
          responses: responses,
          scores: scores,
        },
      });

      if (recError) {
        console.error("Error generando recomendaciones:", recError);
      }

      setTimeout(() => {
        navigate("/health-recommendations");
      }, 1500);

    } catch (error) {
      toast.error("Error inesperado al enviar la encuesta");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderSection = () => {
    const section = sections[currentSection];

    switch (section.id) {
      case "demographics":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <Label className="text-base font-medium">Género *</Label>
              <RadioGroup value={responses.gender} onValueChange={(v) => handleRadioChange("gender", v)}>
                {genderOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`gender-${opt.value}`} />
                    <Label htmlFor={`gender-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="age" className="text-base font-medium">Edad *</Label>
              <Input
                id="age"
                type="number"
                min="18"
                max="100"
                placeholder="Tu edad"
                value={responses.age}
                onChange={(e) => setResponses({ ...responses, age: e.target.value })}
                className="max-w-[200px]"
              />
            </div>
          </div>
        );

      case "health_conditions":
        return (
          <div className="space-y-4 animate-fade-in">
            <Label className="text-base font-medium">Selecciona todas las que apliquen:</Label>
            <div className="grid gap-3">
              {healthConditionOptions.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                  <Checkbox
                    id={`condition-${opt.id}`}
                    checked={responses.healthConditions.includes(opt.id)}
                    onCheckedChange={(checked) => handleCheckboxChange("healthConditions", opt.id, !!checked)}
                  />
                  <Label htmlFor={`condition-${opt.id}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "physical_activity":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cada cuánto realizas actividad física? *</Label>
              <RadioGroup value={responses.physicalActivity} onValueChange={(v) => handleRadioChange("physicalActivity", v)}>
                {physicalActivityOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`activity-${opt.value}`} />
                    <Label htmlFor={`activity-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cuántas horas pasas sentado/a al día? *</Label>
              <RadioGroup value={responses.sedentaryHours} onValueChange={(v) => handleRadioChange("sedentaryHours", v)}>
                {sedentaryHoursOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`sedentary-${opt.value}`} />
                    <Label htmlFor={`sedentary-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4">
              <Checkbox
                id="activeBreaks"
                checked={responses.activeBreaks}
                onCheckedChange={(checked) => setResponses({ ...responses, activeBreaks: !!checked })}
              />
              <Label htmlFor="activeBreaks" className="flex-1 cursor-pointer">
                Realizo pausas activas durante mi jornada laboral
              </Label>
            </div>
          </div>
        );

      case "nutrition":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cuántas veces comes al día? *</Label>
              <RadioGroup value={responses.mealsPerDay} onValueChange={(v) => handleRadioChange("mealsPerDay", v)}>
                {mealsPerDayOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`meals-${opt.value}`} />
                    <Label htmlFor={`meals-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cuáles alimentos comes más regularmente? *</Label>
              <div className="grid gap-3">
                {foodTypeOptions.map((opt) => (
                  <div key={opt.id} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <Checkbox
                      id={`food-${opt.id}`}
                      checked={responses.foodTypes.includes(opt.id)}
                      onCheckedChange={(checked) => handleCheckboxChange("foodTypes", opt.id, !!checked)}
                    />
                    <Label htmlFor={`food-${opt.id}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cuánta agua tomas al día? *</Label>
              <RadioGroup value={responses.waterIntake} onValueChange={(v) => handleRadioChange("waterIntake", v)}>
                {waterIntakeOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`water-${opt.value}`} />
                    <Label htmlFor={`water-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Consumo de cafeína (café, té, bebidas energéticas) *</Label>
              <RadioGroup value={responses.caffeineConsumption} onValueChange={(v) => handleRadioChange("caffeineConsumption", v)}>
                {caffeineOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`caffeine-${opt.value}`} />
                    <Label htmlFor={`caffeine-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case "rest":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cuántas horas duermes en promedio? *</Label>
              <RadioGroup value={responses.sleepHours} onValueChange={(v) => handleRadioChange("sleepHours", v)}>
                {sleepHoursOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`sleep-${opt.value}`} />
                    <Label htmlFor={`sleep-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cómo calificas la calidad de tu sueño? *</Label>
              <RadioGroup value={responses.sleepQuality} onValueChange={(v) => handleRadioChange("sleepQuality", v)}>
                {sleepQualityOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`quality-${opt.value}`} />
                    <Label htmlFor={`quality-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">¿Logras desconectarte del trabajo fuera del horario laboral? *</Label>
              <RadioGroup value={responses.workDisconnection} onValueChange={(v) => handleRadioChange("workDisconnection", v)}>
                {workDisconnectionOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`disconnect-${opt.value}`} />
                    <Label htmlFor={`disconnect-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">¿Con qué frecuencia sientes fatiga durante tu jornada? *</Label>
              <RadioGroup value={responses.dailyFatigue} onValueChange={(v) => handleRadioChange("dailyFatigue", v)}>
                {dailyFatigueOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`fatigue-${opt.value}`} />
                    <Label htmlFor={`fatigue-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case "work_environment":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cada cuánto te realizas chequeos médicos? *</Label>
              <RadioGroup value={responses.medicalCheckup} onValueChange={(v) => handleRadioChange("medicalCheckup", v)}>
                {medicalCheckupOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`checkup-${opt.value}`} />
                    <Label htmlFor={`checkup-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cómo calificas la ergonomía de tu puesto de trabajo? *</Label>
              <RadioGroup value={responses.ergonomicSetup} onValueChange={(v) => handleRadioChange("ergonomicSetup", v)}>
                {ergonomicSetupOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`ergo-${opt.value}`} />
                    <Label htmlFor={`ergo-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cuántas horas al día pasas frente a pantallas? *</Label>
              <RadioGroup value={responses.screenExposure} onValueChange={(v) => handleRadioChange("screenExposure", v)}>
                {screenExposureOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`screen-${opt.value}`} />
                    <Label htmlFor={`screen-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Cuestionario de Salud Laboral</h1>
            <p className="text-sm text-muted-foreground">
              Sección {currentSection + 1} de {sections.length}: {sections[currentSection].title}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {Math.round(progress)}% completado
          </p>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-2xl">{sections[currentSection].title}</CardTitle>
            <CardDescription>{sections[currentSection].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderSection()}

            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button onClick={handleNext} disabled={submitting}>
                {currentSection === sections.length - 1 ? (
                  submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Finalizar"
                  )
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HealthSurvey;
