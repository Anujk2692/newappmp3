package com.mediaapp.service;

import com.mediaapp.dto.FaceCandidateDto;
import com.mediaapp.model.Person;
import lombok.Builder;
import lombok.Value;
import org.opencv.core.Mat;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Scores and ranks people for 1:N face identification. */
final class FaceMatchHelper {

    private FaceMatchHelper() {}

    @Value
    @Builder
    static class PersonScore {
        Person person;
        float score;
        float rawMax;
    }

    @Value
    @Builder
    static class MatchOutcome {
        boolean matched;
        Person bestPerson;
        float bestScore;
        float secondBestScore;
        float requiredGap;
        List<FaceCandidateDto> candidates;
    }

    static MatchOutcome matchAgainstAll(
            Mat queryFeature,
            List<Person> persons,
            FaceAiEngine engine,
            float matchThreshold,
            float baseGap) {

        List<PersonScore> ranked = new ArrayList<>();
        for (Person person : persons) {
            float score = scorePerson(queryFeature, person, engine);
            if (score >= 0) {
                ranked.add(PersonScore.builder().person(person).score(score).rawMax(score).build());
            }
        }

        ranked.sort(Comparator.comparing(PersonScore::getScore).reversed());

        float bestScore = ranked.isEmpty() ? -1f : ranked.get(0).getScore();
        float secondScore = ranked.size() > 1 ? ranked.get(1).getScore() : -1f;
        float gapRequired = computeRequiredGap(persons.size(), baseGap);
        float gap = secondScore < 0 ? Float.MAX_VALUE : bestScore - secondScore;

        Person bestPerson = ranked.isEmpty() ? null : ranked.get(0).getPerson();
        boolean matched = bestPerson != null
                && bestScore >= matchThreshold
                && gap >= gapRequired;

        List<FaceCandidateDto> candidates = ranked.stream()
                .limit(3)
                .map(ps -> FaceCandidateDto.builder()
                        .personId(ps.getPerson().getId())
                        .personName(ps.getPerson().getName())
                        .confidence(toPercent(ps.getScore()))
                        .build())
                .toList();

        return MatchOutcome.builder()
                .matched(matched)
                .bestPerson(bestPerson)
                .bestScore(bestScore)
                .secondBestScore(secondScore)
                .requiredGap(gapRequired)
                .candidates(candidates)
                .build();
    }

    /** Blend best + second-best embedding match for robustness with multiple reference photos. */
    static float scorePerson(Mat queryFeature, Person person, FaceAiEngine engine) {
        if (person.getFaceEmbeddings() == null || person.getFaceEmbeddings().isEmpty()) {
            return -1f;
        }

        List<Float> sims = new ArrayList<>();
        for (List<Float> embedding : person.getFaceEmbeddings()) {
            Mat refFeature = engine.listToFeature(embedding);
            float sim = engine.matchFeatures(queryFeature, refFeature);
            refFeature.release();
            sims.add(sim);
        }

        sims.sort(Comparator.reverseOrder());
        float best = sims.get(0);
        float second = sims.size() > 1 ? sims.get(1) : best * 0.95f;
        return 0.72f * best + 0.28f * second;
    }

    static float computeRequiredGap(int personCount, float baseGap) {
        if (personCount <= 1) {
            return 0f;
        }
        if (personCount <= 3) {
            return Math.max(baseGap, 0.025f);
        }
        if (personCount <= 10) {
            return Math.max(baseGap, 0.03f);
        }
        return Math.min(0.09f, baseGap + personCount * 0.003f);
    }

    static double toPercent(float similarity) {
        if (similarity < 0) {
            return 0;
        }
        return Math.round(Math.max(0, Math.min(100, similarity * 100)) * 10.0) / 10.0;
    }
}
