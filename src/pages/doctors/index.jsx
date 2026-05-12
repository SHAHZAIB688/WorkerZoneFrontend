import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import patient from "../../api/client";
import Loader from "../../components/Loader";
import DoctorsFilterBar from "./components/DoctorsFilterBar";
import DoctorListCard from "./components/DoctorListCard";
import { useBrowserLocation } from "../../state/BrowserLocationContext";

const DoctorsPage = () => {
  const { t, i18n } = useTranslation();
  const geo = useBrowserLocation();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [experience, setExperience] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [searchLoading, setSearchLoading] = useState(false);
  const [nearBy, setNearBy] = useState({ active: false, lat: null, lng: null });

  const EXPERIENCE_OPTIONS = useMemo(
    () => [
      { value: "All", label: t("doctors.exp.all") },
      { value: "0-5", label: t("doctors.exp.range05") },
      { value: "6-10", label: t("doctors.exp.range610") },
      { value: "10+", label: t("doctors.exp.range10") },
    ],
    [t, i18n.language]
  );

  const AVAILABILITY_OPTIONS = useMemo(
    () => [
      { value: "All", label: t("doctors.avail.all") },
      { value: "Monday", label: t("doctors.avail.mon") },
      { value: "Tuesday", label: t("doctors.avail.tue") },
      { value: "Wednesday", label: t("doctors.avail.wed") },
      { value: "Thursday", label: t("doctors.avail.thu") },
      { value: "Friday", label: t("doctors.avail.fri") },
      { value: "Saturday", label: t("doctors.avail.sat") },
      { value: "Sunday", label: t("doctors.avail.sun") },
      { value: "Available Today", label: t("doctors.avail.today") },
      { value: "Available This Week", label: t("doctors.avail.week") },
      { value: "Weekend Only", label: t("doctors.avail.weekend") },
    ],
    [t, i18n.language]
  );

  const fetchDoctors = useCallback(async () => {
    try {
      const params = {};
      if (nearBy.active && nearBy.lat != null && nearBy.lng != null) {
        params.lat = nearBy.lat;
        params.lng = nearBy.lng;
        params.radiusKm = 100;
      }
      const { data } = await patient.get("/doctors", { params });
      setDoctors(data || []);
    } catch {
      toast.error(t("doctors.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, nearBy.active, nearBy.lat, nearBy.lng]);

  useEffect(() => {
    void fetchDoctors();
    const intervalId = setInterval(() => void fetchDoctors(), 30000);
    return () => clearInterval(intervalId);
  }, [fetchDoctors]);

  const enableNearOnPage = async () => {
    let lat = geo.lat;
    let lng = geo.lng;
    if (geo.status !== "ready" || lat == null || lng == null) {
      const loc = await geo.requestLocation();
      if (!loc) {
        toast.error(!navigator.geolocation ? t("auth.geoNotSupported") : t("auth.geoDenied"));
        return;
      }
      lat = loc.lat;
      lng = loc.lng;
    }
    setNearBy({ active: true, lat, lng });
    toast.success(t("doctors.nearMeOn"));
  };

  const clearNearOnPage = () => setNearBy({ active: false, lat: null, lng: null });

  useEffect(() => {
    let result = doctors;
    if (experience !== "All") {
      result = result.filter((doc) => {
        const years = doc.experienceYears || 5;
        if (experience === "0-5") return years <= 5;
        if (experience === "6-10") return years > 5 && years <= 10;
        if (experience === "10+") return years > 10;
        return true;
      });
    }
    if (availability !== "All") {
      result = result.filter(() => true);
    }
    if (search) {
      result = result.filter(
        (doc) =>
          doc.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          doc.specialization?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredDoctors(result);
  }, [search, experience, availability, doctors]);

  const handleSearch = () => {
    setSearchLoading(true);
    setTimeout(() => setSearchLoading(false), 500);
  };

  const resetFilters = () => {
    setSearch("");
    setExperience("All");
    setAvailability("All");
    clearNearOnPage();
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="mb-8 flex flex-col items-center justify-center gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">{t("doctors.pageTitle")}</h1>
        <p className="mt-2 text-slate-600">{t("doctors.pageSubtitle")}</p>
      </section>

      <DoctorsFilterBar
        search={search}
        setSearch={setSearch}
        experience={experience}
        setExperience={setExperience}
        availability={availability}
        setAvailability={setAvailability}
        resetFilters={resetFilters}
        handleSearch={handleSearch}
        searchLoading={searchLoading}
        experienceOptions={EXPERIENCE_OPTIONS}
        availabilityOptions={AVAILABILITY_OPTIONS}
        nearByActive={nearBy.active}
        onNearMe={enableNearOnPage}
        onClearNear={clearNearOnPage}
        nearBusy={geo.status === "loading"}
      />

      {loading ? (
        <div className="flex h-80 items-center justify-center rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader />
            <p className="text-sm font-medium text-slate-500">{t("doctors.fetching")}</p>
          </div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white p-24 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-4xl shadow-inner">
            👨‍⚕️
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{t("doctors.emptyTitle")}</h3>
          <p className="mx-auto mt-3 max-w-md text-slate-500">{t("doctors.emptyText")}</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <DoctorListCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorsPage;
